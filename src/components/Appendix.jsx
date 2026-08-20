import React from 'react';
import { BookOpen, FileText, ShieldAlert, Award, FlaskConical, Brain, AlertTriangle } from 'lucide-react';

export default function Appendix() {
  const sections = [
    {
      title: '一、本系统的报告是怎么来的',
      icon: <FlaskConical size={20} className="icon-green" />,
      content: (
        <>
          <div className="alert alert-warning">
            <AlertTriangle size={20} className="alert-icon" />
            <div className="alert-content">
              <h4>请先读这一段</h4>
              <p>
                本系统的报告由大语言模型生成，<strong>不是数据库检索的结果，也不是量表计算的结论</strong>。
                系统会把你的画作与问卷回答一起提供给模型，并附上一份基于下列文献的行为约束，
                要求它<strong>只做描述与提问，不做诊断与断言</strong>。
              </p>
              <p>
                因此，报告应被视为<strong>一次结构化的自我反思引导</strong>，
                而非对你心理状态的测量或评估。它的价值在于帮你把感受说出来，
                而不在于告诉你"你是什么样的人"。
              </p>
            </div>
          </div>
        </>
      )
    },
    {
      title: '二、绘画作为“表达与干预”：有证据支持',
      icon: <Award size={20} className="icon-blue" />,
      content: (
        <>
          <p>
            把绘画当作<strong>表达与调节的媒介</strong>，是目前证据相对充分的方向。
          </p>
          <div className="appendix-sub-item">
            <strong>1. 迄今最大规模的元分析（Joschko et al., 2024, JAMA Network Open）</strong>
            <p>
              纳入 <strong>69 项随机对照试验、约 4200 名参与者</strong>。结果显示艺术治疗与部分健康结局的改善相关，
              合并效应量 SMD 为 0.19~0.38（小到中等）。
            </p>
            <p className="honest-note">
              但必须同时说明：<strong>217 个结局指标中，81% 未显示改善</strong>，
              且作者明确指出<strong>整体研究质量偏低</strong>。这意味着"艺术治疗有用"是一个有限度的结论，
              而非普遍有效的保证。
            </p>
          </div>
          <div className="appendix-sub-item">
            <strong>2. 焦虑领域（Zhang et al., 2024）</strong>
            <p>
              针对儿童青少年的元分析显示焦虑症状显著下降（SMD=-1.42, 95%CI -2.33~-0.51, p&lt;0.002），
              但研究间异质性很高，提示效果高度依赖具体情境与实施方式。
            </p>
          </div>
          <div className="appendix-sub-item">
            <strong>3. 一个反向的例子（Cochrane, 2018）</strong>
            <p>
              Cochrane 系统综述在痴呆人群中<strong>仅找到 2 项合格研究（共 60 人）</strong>，
              认为证据不足以得出结论。我们把这条一并列出，是为了说明：
              并非所有人群、所有场景都有证据支持。
            </p>
          </div>
        </>
      )
    },
    {
      title: '三、绘画作为“诊断与预测”：已被证伪',
      icon: <ShieldAlert size={20} className="icon-gold" />,
      content: (
        <>
          <p>
            这是本系统<strong>明确拒绝</strong>的方向，也是市面上大量"绘画测心理"内容的问题所在。
          </p>
          <div className="appendix-sub-item">
            <strong>1. 投射技术的科学地位（Lilienfeld, Wood &amp; Garb, 2000）</strong>
            <p>
              这篇发表于《Psychological Science in the Public Interest》的里程碑式评估指出：
              <strong>人物画的效度证据比罗夏墨迹和 TAT 更为薄弱</strong>；
              绝大多数投射指标缺乏实证支持；投射测验普遍<strong>缺乏增量效度</strong>——
              即相对于已有的心理测量工具，并没有增加任何预测力。
            </p>
          </div>
          <div className="appendix-sub-item">
            <strong>2. 单一符号解读无效（Motta, Little &amp; Burns, 1993）</strong>
            <p>
              诸如"画黑云代表焦虑""不画耳朵代表偏执""红色代表愤怒""树冠大代表外向"这类
              公式化的一一对应，在受控实验中<strong>无法可靠预测或诊断任何心理病理状态</strong>。
            </p>
            <p className="honest-note">
              因此本系统在提示词中<strong>明令禁止</strong>模型使用任何符号对照式解读。
              如果你在报告中看到类似表述，那是模型出错，欢迎反馈。
            </p>
          </div>
          <div className="appendix-sub-item">
            <strong>3. 绘画能力会被误读为病理</strong>
            <p>
              研究反复指出：绘画熟练度、空间协调能力、当下的疲劳程度、
              纸笔材质乃至文化背景，都会显著影响画面呈现。
              <strong>画得"乱"或"简单"常被误判为心理问题</strong>，产生假阳性。
              投射测验还整体倾向于识别出<strong>高于实际水平的病理率</strong>。
            </p>
          </div>
          <div className="appendix-sub-item">
            <strong>4. 关于预测与卜卦</strong>
            <p>
              我们检索后确认：<strong>不存在任何支持"通过绘画预测未来"的同行评议实证研究</strong>。
              绘画无法预测事件、运势或结果。心理学文献中与占卜相关的研究，
              考察的是"人为何相信占卜"这一认知与文化现象，而非占卜是否准确。
            </p>
            <p className="honest-note">
              本系统不提供任何预测性内容。若把它包装成预测工具，
              不仅不准确，还可能让人据此做出人生决策或延误真正需要的帮助。
            </p>
          </div>
        </>
      )
    },
    {
      title: '四、那么，为什么它仍然可能对你有帮助',
      icon: <Brain size={20} className="icon-green" />,
      content: (
        <>
          <p>
            关键在于：<strong>起作用的不是"我们解读了你的画"，而是"你描述了自己的感受"。</strong>
          </p>
          <div className="appendix-sub-item">
            <strong>1. 为情绪命名会改变大脑活动（Lieberman et al., 2007）</strong>
            <p>
              这项 fMRI 研究发现，当人把感受用语言表达出来（affect labeling）时，
              <strong>杏仁核活动下降</strong>，右腹外侧前额叶活动增强。
              也就是说，"把说不清的东西说出来"本身就具有情绪调节作用。
            </p>
          </div>
          <div className="appendix-sub-item">
            <strong>2. 结构化的自我表达有健康益处（Pennebaker 传统）</strong>
            <p>
              表达性书写范式的多项随机对照试验与元分析表明，
              围绕情绪经验进行结构化书写与健康指标改善相关。
              研究还发现：<strong>写得越具体、越触及真实情绪，获益越明显</strong>。
              这正是本系统追问"身体感觉"而非"你觉得自己怎么样"的原因。
            </p>
          </div>
          <div className="appendix-sub-item">
            <strong>3. 现象学取向：把解释权还给你（Betensky, 1995）</strong>
            <p>
              现象学艺术治疗主张治疗师<strong>"悬置"（bracketing）自己的预设</strong>，
              不以看懂画作的专家自居，而是引导创作者自己观察、描述画面与创作时的身体感受。
              本系统的五个问题正是这一方法的实现——
              画面观察只用于描述"看到了什么"，<strong>意义必须由你自己赋予</strong>。
            </p>
          </div>
        </>
      )
    },
    {
      title: '五、请警惕“好准”这种感觉',
      icon: <AlertTriangle size={20} className="icon-gold" />,
      content: (
        <>
          <div className="appendix-sub-item">
            <strong>巴纳姆效应 / 福勒效应（Snyder, Shenkel &amp; Lowery, 1977）</strong>
            <p>
              人们普遍倾向于把<strong>模糊、笼统、放之四海皆准</strong>的人格描述，
              当成对自己高度准确的刻画——尤其当这些描述被声称是"为你个人定制"的时候。
            </p>
            <p>
              研究还发现，<strong>自我参照思维倾向较强的人更容易受此影响</strong>
              （Journal of Behavior Therapy and Experimental Psychiatry, 2011）。
            </p>
            <p className="honest-note">
              这意味着：<strong>如果你读完报告觉得"好准"，这本身不能作为报告有效的证据。</strong>
              一份写得温暖而笼统的文字，几乎必然让人产生这种感觉。
              我们在提示词中要求模型宁可具体到只对这一份画作成立，也不要写漂亮的空话——
              但这份警惕仍然需要你自己保有。
            </p>
          </div>
        </>
      )
    },
    {
      title: '六、核心参考文献',
      icon: <FileText size={20} className="icon-blue" />,
      content: (
        <>
          <h4 className="ref-group-title">干预效果</h4>
          <ul className="ref-list">
            <li>
              <strong>Joschko, R., Klatte, C., Grabowska, W. A., Roll, S., Berghöfer, A., &amp; Willich, S. N. (2024).</strong> Active Visual Art Therapy and Health Outcomes: A Systematic Review and Meta-Analysis. <i>JAMA Network Open</i>, 7(9), e2428709.
              <span className="ref-desc">PMID 39264631 · doi:10.1001/jamanetworkopen.2024.28709（69 项 RCT，约 4200 人；效应量小到中等，81% 结局无差异，研究质量偏低）</span>
            </li>
            <li>
              <strong>Zhang, B., Wang, J., &amp; Abdullah, A. B. (2024).</strong> The effects of art therapy interventions on anxiety in children and adolescents: A meta-analysis. <i>Clinics</i>, 79, 100404.
              <span className="ref-desc">PMID 38936289 · doi:10.1016/j.clinsp.2024.100404</span>
            </li>
            <li>
              <strong>Deshmukh, S. R., Holmes, J., &amp; Cardno, A. (2018).</strong> Art therapy for people with dementia. <i>Cochrane Database of Systematic Reviews</i>, 9, CD011073.
              <span className="ref-desc">PMID 30215847 · doi:10.1002/14651858.CD011073.pub2（证据不足以得出结论）</span>
            </li>
          </ul>

          <h4 className="ref-group-title">诊断效度的批判（本系统立场的基础）</h4>
          <ul className="ref-list">
            <li>
              <strong>Lilienfeld, S. O., Wood, J. M., &amp; Garb, H. N. (2000).</strong> The Scientific Status of Projective Techniques. <i>Psychological Science in the Public Interest</i>, 1(2), 27-66.
              <span className="ref-desc">PMID 26151980 · doi:10.1111/1529-1006.002（人物画效度证据最为薄弱；缺乏增量效度）</span>
            </li>
            <li>
              <strong>Motta, R. W., Little, S. G., &amp; Burns, T. F. (1993).</strong> Human figure drawings: The validity of clinical interpretations. <i>School Psychology Quarterly</i>, 8(2), 105-113.
              <span className="ref-desc">（特定绘画符号在诊断心理病理时无效）</span>
            </li>
            <li>
              <strong>Garb, H. N., Wood, J. M., Lilienfeld, S. O., &amp; Nezworski, M. T. (2002).</strong> Effective use of projective techniques in clinical practice: Let's look at the data. <i>Professional Psychology: Research and Practice</i>, 33(5), 454-463.
              <span className="ref-desc">doi:10.1037/0735-7028.33.5.454</span>
            </li>
          </ul>

          <h4 className="ref-group-title">作用机制</h4>
          <ul className="ref-list">
            <li>
              <strong>Lieberman, M. D., Eisenberger, N. I., Crockett, M. J., Tom, S. M., Pfeifer, J. H., &amp; Way, B. M. (2007).</strong> Putting Feelings Into Words: Affect Labeling Disrupts Amygdala Activity in Response to Affective Stimuli. <i>Psychological Science</i>, 18(5), 421-428.
              <span className="ref-desc">PMID 17576282 · doi:10.1111/j.1467-9280.2007.01916.x</span>
            </li>
            <li>
              <strong>Harris, A. H. S. (2006).</strong> Does expressive writing reduce health care utilization? A meta-analysis of randomized trials. <i>Journal of Consulting and Clinical Psychology</i>, 74(2), 243-252.
              <span className="ref-desc">PMID 16649869 · doi:10.1037/0022-006X.74.2.243</span>
            </li>
          </ul>

          <h4 className="ref-group-title">方法论传统</h4>
          <ul className="ref-list">
            <li>
              <strong>Betensky, M. (1995).</strong> <i>What Do You See? Phenomenological Approach to Art Therapy.</i> Jessica Kingsley Publishers.
              <span className="ref-desc">（现象学艺术治疗奠基之作，本系统交互设计的直接来源）</span>
            </li>
            <li>
              <strong>Machover, K. (1949).</strong> <i>Personality Projection in the Drawing of the Human Figure.</i> Charles C Thomas.
              <span className="ref-desc">历史文献 —— 其解读方法已被后续研究证伪，本系统不采用</span>
            </li>
            <li>
              <strong>Buck, J. N. (1948).</strong> The H-T-P Technique. <i>Journal of Clinical Psychology</i>, Monograph Supplement, 4, 1-120.
              <span className="ref-desc">历史文献 —— "房=家庭、树=自我"等对应关系缺乏实证支持，本系统不采用</span>
            </li>
            <li>
              <strong>Goodenough, F. L. (1926).</strong> <i>Measurement of Intelligence by Drawings.</i> World Book Company.
              <span className="ref-desc">历史源流 —— 原始用途是儿童认知测量，与人格投射无关</span>
            </li>
          </ul>

          <h4 className="ref-group-title">认知偏差</h4>
          <ul className="ref-list">
            <li>
              <strong>Snyder, C. R., Shenkel, R. J., &amp; Lowery, C. R. (1977).</strong> Acceptance of personality interpretations: The "Barnum Effect" and beyond. <i>Journal of Consulting and Clinical Psychology</i>, 45(1), 104-114.
              <span className="ref-desc">PMID 321490 · doi:10.1037/0022-006X.45.1.104</span>
            </li>
            <li>
              <strong>Schizotypy, self-referential thinking and the Barnum effect. (2011).</strong> <i>Journal of Behavior Therapy and Experimental Psychiatry</i>, 42(2), 137-141.
              <span className="ref-desc">PMID 21315874 · doi:10.1016/j.jbtep.2010.11.003</span>
            </li>
          </ul>
        </>
      )
    }
  ];

  return (
    <div className="card animate-fade-in text-left">
      <div className="card-header text-center-header">
        <div className="icon-badge">
          <BookOpen className="icon-blue" size={28} />
        </div>
        <h2 className="gradient-text">科学附录</h2>
        <p className="subtitle">这份报告能说明什么，不能说明什么</p>
      </div>

      <div className="card-body scrollable-body">
        <div className="appendix-container">
          {sections.map((section, idx) => (
            <div key={idx} className="appendix-section-box">
              <h3 className="appendix-section-title">
                {section.icon}
                {section.title}
              </h3>
              <div className="appendix-section-content">
                {section.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
