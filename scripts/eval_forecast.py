#!/usr/bin/env python3
"""
[INPUT] 一份时序 CSV（时间列 + 目标列 + 事先已知的输入列）；可选一份「未来输入样例」CSV，用其中非空的列认定哪些输入事先已知；
        环境变量 LIMIX_API_KEY；参照方法需要 pandas、lightgbm、scikit-learn。
[OUTPUT] --out 目录下的 predictions.csv（逐点真值与各方法预测）与 metrics.json（各方法的 MAE、RMSE、R²、LimiX 的 P10–P90 覆盖率、
         每日相对误差得分；train：true 需训练 / false 免训练 / null 朴素参照）。
[POS] 时序预测场景页「效果」一段数字的唯一来源。滚动回测：最近 --days 天里，每天只用截至前一天的历史（与当天事先已知的输入）
      预测当天全部点位，与真值对账。--gap-days N：预测时最近 N 天的目标还拿不到（如实时电价次日才公布），
      历史只用到 N 天前，LimiX 连同这 N 天一起预测、只对账最后一天；朴素参照与 LightGBM 的滞后也相应后移。离线跑一次，页面只读结果。LimiX 的结果按天缓存在 --out/_cache（中断后重跑接着来）；
      参照方法每次现算：LightGBM 用同样的已知输入，加时段、星期与前一天、前一周同时段的目标值，默认参数，每天重训。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

用法（仓库根目录）：
  zsh -ic 'uv run --with pandas --with lightgbm --with scikit-learn python scripts/eval_forecast.py \\
    --source <train.csv> --known-from <test.csv> --target <目标列> --date time \\
    --days 30 --context-days 120 --out data/eval/<slug>/<对象>'
  事先已知的输入：给 --known-from 时取其中非空的列；不给时取除时间、目标、--exclude 之外的全部列。
"""
from __future__ import annotations

import argparse
import io
import json
import math
import os
import time
import urllib.error
import urllib.request
import uuid
from datetime import date
from pathlib import Path

import pandas as pd

BASE = os.environ.get("LIMIX_BASE_URL", "https://limix-api.stable-ai.cn").rstrip("/")
MODEL = os.environ.get("LIMIX_MODEL_TYPE", "LIMIX_16M")
QUANTILES = [0.1, 0.5, 0.9]

LIMIX_COV = "LimiX-16M（带未来输入）"
LIMIX_HIST = "LimiX-16M（只用历史）"
LGBM = "LightGBM"
NAIVE_LAG = {1: "前一天同时段", 2: "前两天同时段"}
NAIVE_D7 = "前一周同时段"


# ──────────────────────────────────────────────────────────────
# LimiX 调用：上传 → 异步时序任务 → 轮询（先等 4 秒、之后每 3 秒）→ 下载。连接失败重试两次。
# ──────────────────────────────────────────────────────────────

def call(path, data=None, headers=None, raw=False):
    for attempt in range(3):
        try:
            req = urllib.request.Request(BASE + path, data=data, headers={"X-API-KEY": os.environ["LIMIX_API_KEY"], **(headers or {})})
            with urllib.request.urlopen(req, timeout=300) as resp:
                body = resp.read()
            break
        except urllib.error.URLError:
            if attempt == 2:
                raise
            time.sleep(2)
    if raw:
        return body.decode("utf-8-sig")
    out = json.loads(body)
    if out.get("code") != 0:
        raise RuntimeError(f"LimiX 错误 {out.get('code')}：{out.get('message')}")
    return out["data"]


def upload(df, name):
    text = df.to_csv(index=False)
    boundary = uuid.uuid4().hex
    body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{name}\"\r\n"
            f"Content-Type: text/csv\r\n\r\n").encode("utf-8") + text.encode("utf-8") + f"\r\n--{boundary}--\r\n".encode("utf-8")
    return call("/v1/data/files", body, {"Content-Type": f"multipart/form-data; boundary={boundary}"})["data_version_id"]


def limix_forecast(hist, fut, target, date_col, known):
    """hist：历史（时间、目标、已知输入）；fut：要预测的点（时间、已知输入），known 为空时不传未来输入。返回 (p50, p10, p90) 三列。"""
    payload = {
        "train_data_version_id": upload(hist, "history.csv"),
        "context_size": len(hist),
        "horizon": len(fut),
        "col_target": target,
        "col_date": date_col,
        "quantile": True,
        "quantile_levels": QUANTILES,
        "model_type": MODEL,
    }
    if known:
        payload["predict_data_version_id"] = upload(fut, "future.csv")
        payload["col_covariates"] = known
    task = call("/v1/inference/timeseries/tasks", json.dumps(payload).encode(), {"Content-Type": "application/json"})
    time.sleep(4)
    while True:
        t = call(f"/v1/inference/tasks/{task['task_id']}")
        if t.get("is_ready"):
            break
        time.sleep(3)
    if not t.get("result_version_id"):
        raise RuntimeError(f"预测未成功：{t.get('status')} {t.get('error_message', '')}")
    res = pd.read_csv(io.StringIO(call(f"/v1/data/download/{t['result_version_id']}", raw=True)))
    if len(res) != len(fut):
        raise RuntimeError(f"结果 {len(res)} 行，应为 {len(fut)} 行")

    def col(q):
        tag = f"q{round(q * 100)}"
        return next((c for c in res.columns if c.startswith("pred_") and tag in c), None)

    point = col(0.5) or next(c for c in res.columns if c.startswith("pred_"))
    return res[point].to_numpy(), res[col(0.1) or point].to_numpy(), res[col(0.9) or point].to_numpy()


# ──────────────────────────────────────────────────────────────
# 参照方法
# ──────────────────────────────────────────────────────────────

def calendar(df, date_col, per_day):
    t = pd.to_datetime(df[date_col])
    minutes = t.dt.hour * 60 + t.dt.minute
    return pd.DataFrame({"slot": (minutes // (1440 // per_day)).to_numpy(), "weekday": t.dt.weekday.to_numpy()})


def lgbm_forecast(hist, fut, target, date_col, known, per_day, truth, lag_days=1):
    """同样的事先已知输入，加时段、星期与 lag_days 天前、前一周同时段的目标值（预测时都已知）；默认参数，每天用同一段历史重训"""
    from lightgbm import LGBMRegressor

    def features(df):
        t = pd.to_datetime(df[date_col])
        lags = pd.DataFrame({
            "lag_near": truth.reindex(t - pd.Timedelta(days=lag_days)).to_numpy(),
            "lag_7d": truth.reindex(t - pd.Timedelta(days=7)).to_numpy(),
        })
        return pd.concat([calendar(df, date_col, per_day), df[known].reset_index(drop=True), lags], axis=1)

    model = LGBMRegressor(random_state=0, verbose=-1)
    model.fit(features(hist), hist[target].to_numpy())
    return model.predict(features(fut))


def metrics(y, p, low=None, high=None):
    """朴素参照在缺数日之后没有值（如前一天同时段），这些点只在该方法里跳过"""
    y = pd.Series(y, dtype=float).reset_index(drop=True)
    p = pd.Series(p, dtype=float).reset_index(drop=True)
    ok = p.notna()
    y, p = y[ok].reset_index(drop=True), p[ok].reset_index(drop=True)
    if low is not None:
        low = pd.Series(low, dtype=float).reset_index(drop=True)[ok].reset_index(drop=True)
        high = pd.Series(high, dtype=float).reset_index(drop=True)[ok].reset_index(drop=True)
    err = p - y
    out = {
        "mae": float(err.abs().mean()),
        "rmse": float(math.sqrt((err ** 2).mean())),
        "r2": float(1 - (err ** 2).sum() / ((y - y.mean()) ** 2).sum()),
    }
    if low is not None:
        low = pd.Series(low, dtype=float).reset_index(drop=True)
        high = pd.Series(high, dtype=float).reset_index(drop=True)
        out["coverage_p10_p90"] = float(((y >= low) & (y <= high)).mean())
    return out


def daily_score(frame, col):
    """每日得分 = max(100 − |当天 MAE ÷ 当天均价| × 100, 0)，取各天平均（与华能竞赛评分同口径）"""
    scores = []
    for _, g in frame.dropna(subset=[col]).groupby("day"):
        avg = g["truth"].mean()
        mae = (g[col] - g["truth"]).abs().mean()
        scores.append(0.0 if avg == 0 else max(100 - abs(mae / avg) * 100, 0.0))
    return float(sum(scores) / len(scores))


def main():
    ap = argparse.ArgumentParser(description="时序预测场景的离线滚动回测：LimiX 与参照方法逐日对账。")
    ap.add_argument("--source", required=True, help="时序 CSV：时间列、目标列、事先已知的输入列")
    ap.add_argument("--known-from", help="未来输入样例 CSV：其中非空的列认定为事先已知的输入；不传则除时间、目标外的列都算")
    ap.add_argument("--exclude", default="", help="不算事先已知的列，逗号分隔（如预测日前电价时的实时电价）")
    ap.add_argument("--gap-days", type=int, default=0, help="预测时最近几天的目标还拿不到；历史只用到这几天之前（如实时电价填 1）")
    ap.add_argument("--extra-known", default="", help="另外认定为事先已知的列，逗号分隔（如预测实时电价时，当天的日前电价已出清）")
    ap.add_argument("--naive-col", default="", help="再加一个朴素参照：直接用这一列当预测（如预测实时电价时直接用当天的日前电价）")
    ap.add_argument("--naive-label", default="", help="上面那个参照在页面上的名字，默认「直接用<列名>」")
    ap.add_argument("--target", required=True)
    ap.add_argument("--date", default="time")
    ap.add_argument("--days", type=int, default=30, help="回测最近几天")
    ap.add_argument("--context-days", type=int, default=120, help="每次给 LimiX 的历史天数")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    naive_name = a.naive_label or f"直接用{a.naive_col}"
    out = Path(a.out)
    cache = out / "_cache"
    cache.mkdir(parents=True, exist_ok=True)

    src = pd.read_csv(a.source)
    src[a.date] = pd.to_datetime(src[a.date])
    src = src.sort_values(a.date).reset_index(drop=True)
    if a.known_from:
        ref = pd.read_csv(a.known_from)
        filled = ref.notna().sum()
        known = [c for c in ref.columns if c not in (a.date, a.target) and filled[c] > 0 and c in src.columns]
    else:
        excluded = {c.strip() for c in a.exclude.split(",") if c.strip()}
        known = [c for c in src.columns if c not in (a.date, a.target) and c not in excluded]
    known += [c.strip() for c in a.extra_known.split(",") if c.strip() and c.strip() not in known and c.strip() != a.target]
    per_day = int(src.groupby(src[a.date].dt.normalize()).size().mode().iloc[0])
    days = sorted(src[a.date].dt.normalize().unique())[-a.days:]
    gap = pd.Timedelta(days=a.gap_days)
    naive_near = NAIVE_LAG.get(1 + a.gap_days, f"前 {1 + a.gap_days} 天同时段")
    print(f"目标 {a.target}｜事先已知的输入 {len(known)} 列｜每天 {per_day} 点｜间隔 {a.gap_days} 天｜回测 {days[0].date()} 至 {days[-1].date()}，共 {len(days)} 天", flush=True)

    truth = src.set_index(a.date)[a.target]
    frames = []
    for i, d in enumerate(days, start=1):
        d = pd.Timestamp(d)
        hist = src[src[a.date] < d - gap].tail(a.context_days * per_day)
        # LimiX 连同间隔的几天一起预测（这几天的已知输入照样有），只取最后一天对账
        span = src[(src[a.date] >= d - gap) & (src[a.date] < d + pd.Timedelta(days=1))]
        fut = span[span[a.date] >= d]
        skip = len(span) - len(fut)
        hist_known = hist[[a.date, a.target] + known].copy()
        hist_known[known] = hist_known[known].ffill().bfill()
        span_known = span[[a.date] + known].copy()
        span_known[known] = span_known[known].ffill().bfill()
        fut_known = span_known.iloc[skip:]
        # 只缓存 LimiX 的结果（要调接口）；参照方法每次现算，改了参照不用重调 LimiX
        f = cache / f"{d.date()}.csv"
        limix_cols = [LIMIX_COV, "cov_p10", "cov_p90", LIMIX_HIST, "hist_p10", "hist_p90"]
        if f.exists():
            limix = pd.read_csv(f)[limix_cols]
            print(f"[{i}/{len(days)}] {d.date()} LimiX 已缓存", flush=True)
        else:
            t0 = time.time()
            cov = limix_forecast(hist_known, span_known, a.target, a.date, known)
            only = limix_forecast(hist[[a.date, a.target]], span[[a.date]], a.target, a.date, [])
            limix = pd.DataFrame(dict(zip(limix_cols, [c[skip:] for c in (*cov, *only)])))
            limix.to_csv(f, index=False)
            print(f"[{i}/{len(days)}] {d.date()} LimiX 带未来输入 MAE {(limix[LIMIX_COV] - fut[a.target].to_numpy()).abs().mean():.1f}（{time.time() - t0:.0f} 秒）", flush=True)
        frame = pd.DataFrame({
            "time": fut[a.date].to_numpy(),
            "truth": fut[a.target].to_numpy(),
            **{c: limix[c].to_numpy() for c in limix_cols},
            LGBM: lgbm_forecast(hist_known, fut_known, a.target, a.date, known, per_day, truth, 1 + a.gap_days),
            naive_near: truth.reindex(fut[a.date] - pd.Timedelta(days=1 + a.gap_days)).to_numpy(),
            NAIVE_D7: truth.reindex(fut[a.date] - pd.Timedelta(days=7)).to_numpy(),
            **({naive_name: fut[a.naive_col].to_numpy()} if a.naive_col else {}),
        })
        frames.append(frame)

    allp = pd.concat(frames, ignore_index=True).dropna(subset=["truth"])
    allp["day"] = pd.to_datetime(allp["time"]).dt.normalize()
    methods = {
        LIMIX_COV: {**metrics(allp["truth"], allp[LIMIX_COV], allp["cov_p10"], allp["cov_p90"]), "train": False},
        LIMIX_HIST: {**metrics(allp["truth"], allp[LIMIX_HIST], allp["hist_p10"], allp["hist_p90"]), "train": False},
        LGBM: {**metrics(allp["truth"], allp[LGBM]), "train": True},
        naive_near: {**metrics(allp["truth"], allp[naive_near]), "train": None},
        NAIVE_D7: {**metrics(allp["truth"], allp[NAIVE_D7]), "train": None},
        **({naive_name: {**metrics(allp["truth"], allp[naive_name]), "train": None}} if a.naive_col else {}),
    }
    for name in methods:
        methods[name]["daily_score"] = daily_score(allp, name)
    result = {
        "date": date.today().isoformat(),
        "model": MODEL,
        "target": a.target,
        "known_inputs": known,
        "gap_days": a.gap_days,
        "points_per_day": per_day,
        "context_rows": a.context_days * per_day,
        "test_rows": int(len(allp)),
        "test_days": [str(pd.Timestamp(d).date()) for d in days],
        "methods": methods,
    }
    (out / "metrics.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    allp.drop(columns=["day"]).to_csv(out / "predictions.csv", index=False)
    print("\n方法｜MAE｜RMSE｜R²｜每日得分")
    for name, m in sorted(methods.items(), key=lambda kv: kv[1]["mae"]):
        cov = f"｜区间命中 {m['coverage_p10_p90']:.0%}" if "coverage_p10_p90" in m else ""
        print(f"{name}｜{m['mae']:.1f}｜{m['rmse']:.1f}｜{m['r2']:.3f}｜{m['daily_score']:.1f}{cov}")


if __name__ == "__main__":
    main()
