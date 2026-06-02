export type ViralScriptType = 'persona' | 'qianchuan' | 'live' | 'tiktok'

export type MockViralScript = {
  id: string
  title: string
  type: ViralScriptType
  sourceUrl: string
  likes: number
  publishedAt: string
  transcript: string
  kolId: string | null
  kolName: string | null
  productId: string | null
  productName: string | null
}

export const mockViralScripts: MockViralScript[] = [
  // 人设爆款
  {
    id: '1',
    title: '45岁重新出发，我做到了',
    type: 'persona',
    sourceUrl: 'https://www.douyin.com/video/xxx001',
    likes: 128000,
    publishedAt: '2026-04-15T10:00:00Z',
    transcript: `姐妹们，我45岁那年，做了一个让所有人都觉得我疯了的决定。

我辞职了。

十八年的铁饭碗，说扔就扔了。

很多人问我，你怕吗？

怕啊，当然怕。

但我更怕的，是再过十年，回头看这段时间，发现我什么都没改变。

所以我选择了怕着去做。

现在一年过去了，我想告诉那些还在纠结的人——

你不是走错了路，只是走了更长的路。

那条更长的路，也许才是你真正的路。`,
    kolId: '1',
    kolName: '陶然',
    productId: '1',
    productName: '胶原蛋白精华液',
  },
  {
    id: '2',
    title: '当妈妈说"你不如别人家的孩子"',
    type: 'persona',
    sourceUrl: 'https://www.douyin.com/video/xxx002',
    likes: 95000,
    publishedAt: '2026-04-22T14:00:00Z',
    transcript: `你有没有听过这句话：

"你看看别人家的孩子。"

我妈说了我三十年。

直到有一天，我坐下来，认真问她：

妈，你真的觉得我不好吗？

她愣了。

然后她哭了。

她说，我就是怕你不努力，才这么说的。

我们中国的妈妈啊，把爱包在了批评里。

那天之后，我才真正理解了她。

也才真正放下了那段话。`,
    kolId: '1',
    kolName: '陶然',
    productId: null,
    productName: null,
  },
  {
    id: '3',
    title: '用AI写汇报PPT，30分钟完成老板满意',
    type: 'persona',
    sourceUrl: 'https://www.douyin.com/video/xxx003',
    likes: 210000,
    publishedAt: '2026-05-01T09:00:00Z',
    transcript: `打工人必看！

领导突然说，明天早上要一份季度汇报PPT。

换以前，我得熬到凌晨三点。

但现在，我30分钟就搞定了。

方法很简单，我来告诉你……

第一步，把数据丢给AI，让它整理成大纲。

第二步，用AI生成每页的核心观点。

第三步，自己微调语言，加上自己的判断。

总共用了28分钟。

领导看完说：这次比上次好多了。

省下来的时间，我去睡觉了。`,
    kolId: '2',
    kolName: '林晓雨',
    productId: null,
    productName: null,
  },
  // 千川爆款
  {
    id: '4',
    title: '【千川素材】护肤28天蜕变对比',
    type: 'qianchuan',
    sourceUrl: 'https://www.douyin.com/video/xxx004',
    likes: 56000,
    publishedAt: '2026-04-10T11:00:00Z',
    transcript: `还在用大牌护肤品花大钱却看不到效果？

听我说，不是你的皮肤问题，是你的产品选错了。

我用了28天这款胶原蛋白精华液，皮肤真的变了。

来，你们看……

左边是28天前，右边是现在。

毛孔、细纹、肤色……对比非常明显。

299块，一滴一滴用，用了两个月。

算下来，每天成本5块钱不到。

比外面随便一杯奶茶还便宜。

但效果你们看到了，真的不一样。`,
    kolId: '1',
    kolName: '陶然',
    productId: '1',
    productName: '胶原蛋白精华液',
  },
  {
    id: '5',
    title: '【千川素材】肠胃不好的救星来了',
    type: 'qianchuan',
    sourceUrl: 'https://www.douyin.com/video/xxx005',
    likes: 42000,
    publishedAt: '2026-04-18T16:00:00Z',
    transcript: `便秘、腹胀、消化不好……

很多人以为这是小毛病，忍忍就过了。

我以前也这么想。

直到医生告诉我，肠道健康直接影响免疫力和皮肤状态。

我开始重视了。

用了这款益生菌固体饮料，300亿活性菌，一天一包。

第一周就感觉肠胃顺畅多了。

现在用了三个月，皮肤都比以前好，整个人也没那么容易累了。

真的不骗你，肠道好了，整个人都好了。`,
    kolId: null,
    kolName: null,
    productId: '2',
    productName: '益生菌固体饮料',
  },
  {
    id: '6',
    title: '【千川素材】防晒霜真实测评',
    type: 'qianchuan',
    sourceUrl: 'https://www.douyin.com/video/xxx006',
    likes: 38000,
    publishedAt: '2026-05-05T14:00:00Z',
    transcript: `夏天快到了，防晒一定不能省！

但防晒霜那么多，怎么选？

我测了12款，最后留下了这一款。

89块，不贵，但是……

你看这个防晒测试，户外暴晒2小时，肤色对比。

涂了的地方，完全没有晒红。

而且！它完全不油腻，上完妆也可以用，不起屑。

游泳的姐妹也可以用，防水实测40分钟有效。

89块能买到这种体验，真的很值。`,
    kolId: null,
    kolName: null,
    productId: '3',
    productName: '防晒霜SPF50+',
  },
  // 直播间爆款
  {
    id: '7',
    title: '直播爆款话术：胶原蛋白精华液逼单',
    type: 'live',
    sourceUrl: 'https://www.douyin.com/video/xxx007',
    likes: 31000,
    publishedAt: '2026-04-08T20:00:00Z',
    transcript: `来来来，宝贝们，这款今晚最后100单！

我知道你们在想什么——之前买过很多精华液，效果都一般。

这款不一样！我来给你看用户反馈……

你看，她用了28天，自己拍的对比图。

我们不说玄的，就说这个图，你们自己判断。

而且今晚这个价格，299，这是全年最低！

明天就恢复原价380了。

喜欢的宝贝，直接扣"要"，助理马上给你发购物车链接！

最后100单了，手快有手慢无！`,
    kolId: '1',
    kolName: '陶然',
    productId: '1',
    productName: '胶原蛋白精华液',
  },
  {
    id: '8',
    title: '直播爆款话术：益生菌种草引流',
    type: 'live',
    sourceUrl: 'https://www.douyin.com/video/xxx008',
    likes: 27000,
    publishedAt: '2026-04-25T21:00:00Z',
    transcript: `新来的宝贝，我先自我介绍一下。

我叫陶然，在抖音分享中年女性的成长故事。

今天给大家分享一个我用了三个月的好东西——

益生菌固体饮料。

为什么推荐它？因为我真的用了，真的有效果。

你们知道我以前肠胃不好，经常腹胀。

用了这个，第一周就明显改善了。

现在三个月了，皮肤也比以前好，整个人精神很多。

一盒168，30包，一个月的量。

比很多保健品便宜，但效果你们可以问我的老粉。

要的扣1，我让助理给你们发链接。`,
    kolId: '1',
    kolName: '陶然',
    productId: '2',
    productName: '益生菌固体饮料',
  },
  {
    id: '9',
    title: '直播爆款话术：防晒霜夏日限时活动',
    type: 'live',
    sourceUrl: 'https://www.douyin.com/video/xxx009',
    likes: 19000,
    publishedAt: '2026-05-10T20:00:00Z',
    transcript: `宝贝们，夏天来了，防晒是头等大事！

我测了市面上很多防晒霜，今天给大家介绍一款89块的神仙产品。

SPF50+ PA++++，这个防护等级，很多大牌都只有这个级别。

但大牌的价格是它的三到五倍！

关键是它不泛白、不油腻，男生女生都适合。

今晚我们有福利——买2赠1！

只剩200套，先到先得！

喜欢的扣"防晒"，马上给你们发购物车！`,
    kolId: null,
    kolName: null,
    productId: '3',
    productName: '防晒霜SPF50+',
  },
  // TikTok爆款
  {
    id: '10',
    title: 'Chinese Skincare Routine That Changed My Life',
    type: 'tiktok',
    sourceUrl: 'https://www.tiktok.com/@user/video/xxx010',
    likes: 890000,
    publishedAt: '2026-03-20T08:00:00Z',
    transcript: `POV: You tried every expensive skincare and nothing worked.

Then you discovered this Chinese collagen serum for $40.

Day 1: Applied it before bed. Skin felt plump immediately.

Day 7: My coworker asked if I got a facial.

Day 28: I genuinely cannot believe this is my skin.

The secret? Triple collagen complex with molecules small enough to actually penetrate.

It's not magic. It's science.

Link in bio. You're welcome.`,
    kolId: null,
    kolName: null,
    productId: '1',
    productName: '胶原蛋白精华液',
  },
  {
    id: '11',
    title: 'I Fixed My Gut in 30 Days (No BS)',
    type: 'tiktok',
    sourceUrl: 'https://www.tiktok.com/@user/video/xxx011',
    likes: 560000,
    publishedAt: '2026-04-02T10:00:00Z',
    transcript: `Things I noticed after taking 300 billion CFU probiotics daily for 30 days:

Week 1 - Less bloating after meals
Week 2 - Actually waking up feeling rested
Week 3 - Skin started clearing up (didn't expect this)
Week 4 - Energy levels way more stable

The freeze-dry technology keeps them alive at room temp.

No refrigeration needed. No excuses.

Been using this for 3 months now. Not stopping anytime soon.`,
    kolId: null,
    kolName: null,
    productId: '2',
    productName: '益生菌固体饮料',
  },
  {
    id: '12',
    title: '$12 Sunscreen vs $80 Sunscreen: Honest Test',
    type: 'tiktok',
    sourceUrl: 'https://www.tiktok.com/@user/video/xxx012',
    likes: 1200000,
    publishedAt: '2026-05-01T12:00:00Z',
    transcript: `I spent a month testing cheap vs expensive sunscreen.

The $80 one: great packaging, nice smell, works fine.

The $12 one: SPF50+ PA++++, waterproof for 40 minutes, no white cast.

Same UV protection level. 1/7 the price.

The sunscreen industry doesn't want you to know this.

I've been using the cheap one all summer. Zero regrets.

Not going back.`,
    kolId: null,
    kolName: null,
    productId: '3',
    productName: '防晒霜SPF50+',
  },
]

export const VIRAL_SCRIPT_TYPE_LABELS: Record<ViralScriptType, string> = {
  persona: '人设爆款',
  qianchuan: '千川爆款',
  live: '直播间爆款',
  tiktok: 'TikTok爆款',
}
