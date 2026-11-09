# 鸟讯点位说明：同一来源只展示一次

状态：按已确认的展示层方案实现。不改原始数据、簇、presence、坐标和地图。

## 行为

`notes_html` 把同一条说明的重复副本收成一条。标题里的数字是合并后的说明数，不再把副本数当成帖子来源数。

可以合并的副本必须同时满足：

- 有稳定身份：优先 `post_id`，否则用去掉 query 和 fragment 的 URL。两者都没有则各自保留。
- 评论身份相同：有 `comment_id` 就用它。没有 ID 时，带「评论区作者回复 / 评论区网友」的说明用整段 `spot_detail` 区分；文字不同就不合并。正文和评论也不合并。
- 来源全文、日期、南汇区块、`spot` / `park`、`spot_detail`、引语、怎么去、地点标签、置信都相同。

鸟种只来自本块鸟种行里明确挂上同一 `post_id` 或同一 URL 的记录。不从正文扫鸟名。`status` / `claim` 为阴性、弱、不定时照样列出，并标上「阴性 / 弱 / 不定」。没有状态的关联只显示鸟名，不写成可靠目击。

`spot_detail` 保留。`evidence` 里和原文逐句相同的句子不重复贴；原文没有的句子保留。`obs_date_source` 为 `post_time_only` 时写明观察日未在正文写明。单独的 medium 不产生这句话。

## 不做

不改 digest、`members_meta` 的存储、presence、GCJ-02、`web/news.js`、`web/basemap.js`。不靠正文相似度合并。
