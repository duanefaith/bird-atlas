# 鸟讯点位说明去重 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 同一帖子或同一评论的点位说明只展示一次，并标出明确关联的鸟种。

**Architecture:** 只改 `build_news.py` 的 `notes_html` 和少量样式。分组键包含稳定身份、评论身份和确切说明。鸟种来自 `rows[].posts`。

**Tech Stack:** 现有 Python 3。测试文件可直接 `python3 tests/test_notes_group.py`。

## Global Constraints

- 不修改 `web/news.js` 与 `web/basemap.js`。
- 不改写出 `news.json` 的 `data = {'generated_at' ... 'places': mp}` 段。
- 无 `post_id` 且无 URL 的条目不合并。
- 无 `comment_id` 的不同评论不合并。
- 阴性、弱、不定必须带字面状态。

---

### Task 1: 展示层分组

**Files:**
- Modify: `/workspace/birdnews/build_news.py`
- Modify: `/workspace/birdnews/web/news.css`
- Test: `/workspace/birdnews/tests/test_notes_group.py`

- [x] **Step 1: Write the failing test**

测试覆盖 4 条副本收成 2 条说明、多鸟种高亮、同源不同评论、不同评论 ID、不同来源/日期/区块/置信、无身份不合并、`post_id`、URL query、HTML 转义、相同 evidence 不重复、独有 evidence 保留、输入不被改写、地图文件哈希不变。

- [x] **Step 2: Run test to verify it fails**

Run: `python3 tests/test_notes_group.py`

Expected: FAIL，`notes_html()` 不接受 `rows`。

- [x] **Step 3: Write minimal implementation**

`notes_html(posts, members_meta=None, rows=None, block=None)` 按上面的键分组。南汇调用传入该块的 `rows` 和 `block`。证据用 `unique_evidence_clauses`。

- [x] **Step 4: Run test to verify it passes**

Run: `python3 tests/test_notes_group.py`

Expected: `RESULT 14 pass 0 fail`

- [x] **Step 5: Commit**

图鉴仓库只提交设计和计划。可安装的源文件放在给父机的 tar 里，不把整条 birdnews 流水线放进图鉴仓库。
