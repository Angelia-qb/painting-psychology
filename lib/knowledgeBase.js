/**
 * 知识库：绘画心理分析的实证基础
 *
 * ⚠️ 编制原则（重要，修改前请先读）
 *
 * 这个知识库的作用是**约束**模型，不是给模型提供"解读词典"。
 *
 * 收录标准：
 *   1. 必须是可核查的同行评议文献（附 PMID/DOI）
 *   2. 优先系统综述与随机对照试验，其次经典理论著作
 *   3. **证伪性证据与支持性证据同等收录** —— 这是本库的核心立场
 *
 * 明确不收录：
 *   - "符号 → 含义"对照表（如"红色=愤怒""房子=家庭""树冠大=外向"）
 *     理由：Lilienfeld et al. (2000) 等研究已证实这类单一符号解读
 *     缺乏效度。把它们喂给模型只会让模型更自信地胡说，比不给更糟。
 *   - 占卜、卜卦、预测类内容
 *     理由：无任何实证支持；且"预测"框架会诱发巴纳姆效应，
 *     使用户把泛泛之辞误认为准确洞察，属于主动误导。
 *
 * 证据结论一句话概括：
 *   绘画作为**治疗/表达干预**有中等且真实的效果（但研究质量普遍偏低）；
 *   绘画作为**诊断/预测工具**没有效度支持。
 *   因此本系统定位为前者，绝不做后者。
 */

export const EVIDENCE_BASE = {
  /* ───────────── 一、干预效果：支持性证据 ───────────── */
  efficacy: [
    {
      id: 'joschko2024',
      cite: 'Joschko, R., Klatte, C., Grabowska, W. A., Roll, S., Berghöfer, A., & Willich, S. N. (2024). Active Visual Art Therapy and Health Outcomes: A Systematic Review and Meta-Analysis. JAMA Network Open, 7(9), e2428709.',
      id_ext: 'PMID 39264631 · doi:10.1001/jamanetworkopen.2024.28709',
      finding:
        '纳入 69 项 RCT、约 4200 名参与者。艺术治疗在 18% 的结局指标上优于对照组，81% 无差异。合并效应量 SMD=0.38（基线变化）与 0.19（后测），属小到中等。作者明确指出：整体研究质量偏低。',
      weight:
        '这是目前最大规模的证据综合。它既支持"有效果"，也提醒效果有限且证据质量不高——两面都要如实呈现。'
    },
    {
      id: 'anxiety_meta2024',
      cite: 'Zhang, B., Wang, J., & Abdullah, A. B. (2024). The effects of art therapy interventions on anxiety in children and adolescents: A meta-analysis. Clinics, 79, 100404.',
      id_ext: 'PMID 38936289 · doi:10.1016/j.clinsp.2024.100404',
      finding: '儿童青少年焦虑症状显著下降，SMD=-1.42（95%CI -2.33 至 -0.51, p<0.002），但异质性很高（Tau²=1.x），提示各研究间差异大。',
      weight: '效应量大但异质性高，说明"在某些情境下很有用"，而非"普遍有效"。'
    },
    {
      id: 'cochrane_dementia2018',
      cite: 'Deshmukh, S. R., Holmes, J., & Cardno, A. (2018). Art therapy for people with dementia. Cochrane Database of Systematic Reviews, 9, CD011073.',
      id_ext: 'PMID 30215847 · doi:10.1002/14651858.CD011073.pub2',
      finding: '仅 2 项研究符合纳入标准（共 60 人），证据不足以得出结论。',
      weight:
        'Cochrane 的谨慎结论是重要平衡。它说明在某些人群中，艺术治疗的证据其实很薄弱。不能因为"有很多综述"就以为处处有效。'
    },
    {
      id: 'depression_meta2024',
      cite: 'The effects of visual art therapy on adults with depressive symptoms: A systematic review and meta-analysis. (2024). International Journal of Mental Health Nursing.',
      id_ext: 'PMID 38606659 · doi:10.1111/inm.13331',
      finding: '视觉艺术治疗对成人抑郁症状有改善作用。',
      weight: '与 JAMA 综述方向一致。'
    }
  ],

  /* ───────────── 二、诊断效度：证伪性证据（关键） ───────────── */
  invalidity: [
    {
      id: 'lilienfeld2000',
      cite: 'Lilienfeld, S. O., Wood, J. M., & Garb, H. N. (2000). The Scientific Status of Projective Techniques. Psychological Science in the Public Interest, 1(2), 27-66.',
      id_ext: 'PMID 26151980 · doi:10.1111/1529-1006.002',
      finding:
        '系统评估罗夏、TAT 与人物画等投射技术。结论：人物画的效度证据比罗夏和 TAT 更为薄弱；绝大多数投射指标缺乏实证支持；投射测验普遍缺乏增量效度（即相对已有心理测量工具没有增加预测力）。',
      weight: '**本系统最重要的一篇文献。** 它直接否定了"看画断心理"的做法。'
    },
    {
      id: 'motta1993',
      cite: 'Motta, R. W., Little, S. G., & Burns, T. F. (1993). Human figure drawings: The validity of clinical interpretations. School Psychology Quarterly, 8(2), 105-113.',
      id_ext: '',
      finding: '特定绘画符号特征在诊断心理病理时无效。',
      weight: '符号化解读的直接反证。'
    },
    {
      id: 'garb2002',
      cite: 'Garb, H. N., Wood, J. M., Lilienfeld, S. O., & Nezworski, M. T. (2002). Effective use of projective techniques in clinical practice: Let\'s look at the data. Professional Psychology: Research and Practice, 33(5), 454-463.',
      id_ext: 'doi:10.1037/0735-7028.33.5.454',
      finding: '评估投射法在实际临床操作中的信效度边界，建议严格限制其使用范围。',
      weight: ''
    },
    {
      id: 'artistic_skill_confound',
      cite: 'Lilienfeld et al. (2000); Garb et al. (2002) 中反复提及的方法学问题。',
      id_ext: '',
      finding:
        '绘画能力、空间协调能力、当下疲劳程度、纸笔材质、文化背景都会显著影响画面呈现。绘画技巧差常被误判为心理病理，产生"假阳性"。',
      weight:
        '**直接影响本系统的提问方式**：绝不能因为画得"乱""简单""比例失调"就做任何推断。'
    },
    {
      id: 'over_pathologizing',
      cite: 'Lilienfeld, S. O., Wood, J. M., & Garb, H. N. (2000), 同上。',
      id_ext: '',
      finding: '投射测验倾向于识别出高于实际水平的心理病理率（over-pathologizing）。',
      weight: '这是本系统禁止诊断性表述的核心理由：宁可不说，也不要制造不存在的问题。'
    }
  ],

  /* ───────────── 三、为什么"表达"本身有用：机制证据 ───────────── */
  mechanism: [
    {
      id: 'lieberman2007',
      cite: 'Lieberman, M. D., Eisenberger, N. I., Crockett, M. J., Tom, S. M., Pfeifer, J. H., & Way, B. M. (2007). Putting Feelings Into Words: Affect Labeling Disrupts Amygdala Activity in Response to Affective Stimuli. Psychological Science, 18(5), 421-428.',
      id_ext: 'PMID 17576282 · doi:10.1111/j.1467-9280.2007.01916.x',
      finding:
        'fMRI 研究：为情绪命名（affect labeling）会降低杏仁核活动，并增强右腹外侧前额叶活动。即"把感受说出来"本身具有情绪调节作用。',
      weight:
        '**这是本系统问卷设计的神经科学依据。** 价值不在于我们"解读"了画，而在于用户被引导去描述和命名自己的感受。'
    },
    {
      id: 'affect_labeling2022',
      cite: 'Affect labeling: The role of timing and intensity. (2022). PLoS ONE, 17(12), e0279303.',
      id_ext: 'PMID 36580454 · doi:10.1371/journal.pone.0279303',
      finding: '进一步检验情绪命名的时机与强度条件下的效果。',
      weight: '说明情绪命名并非万能，效果依情境而定。'
    },
    {
      id: 'pennebaker_meta2006',
      cite: 'Harris, A. H. S. (2006). Does expressive writing reduce health care utilization? A meta-analysis of randomized trials. Journal of Consulting and Clinical Psychology, 74(2), 243-252.',
      id_ext: 'PMID 16649869 · doi:10.1037/0022-006X.74.2.243',
      finding: '表达性书写范式的元分析，检验其对健康服务使用的影响。',
      weight:
        'Pennebaker 表达性书写传统是"结构化自我表达有益"的最扎实证据线之一，也是本系统五问问卷的范式来源。'
    },
    {
      id: 'expressive_writing_predictors2023',
      cite: 'Can emotional expressivity and writing content predict beneficial effects of expressive writing? (2023). Psychological Medicine.',
      id_ext: 'PMID 34425924 · doi:10.1017/S0033291721003111',
      finding: '书写内容与情绪表达度可预测表达性书写的获益程度。',
      weight: '提示：用户写得越具体、越触及情绪，越可能获益——支持本系统追问身体感受的做法。'
    }
  ],

  /* ───────────── 四、方法论传统：为什么用"画后询问"而非"解读" ───────────── */
  method: [
    {
      id: 'betensky1995',
      cite: 'Betensky, M. (1995). What Do You See? Phenomenological Approach to Art Therapy. Jessica Kingsley Publishers.',
      id_ext: '',
      finding:
        '现象学艺术治疗奠基之作。主张治疗师"悬置"（bracketing）自身预设，不以专家身份解读画作，而是引导创作者自己观察、描述画面与创作时的身体感受。',
      weight: '**本系统交互设计的直接来源。** 五个问题就是在做"引导观察"而非"专家解读"。'
    },
    {
      id: 'machover1949',
      cite: 'Machover, K. (1949). Personality Projection in the Drawing of the Human Figure. Charles C Thomas.',
      id_ext: '',
      finding: '将画人测验从智力测量推广为投射性人格评估。',
      weight: '**历史文献，其解读方法已被证伪。** 收录用于说明源流，不作为分析依据。'
    },
    {
      id: 'buck1948',
      cite: 'Buck, J. N. (1948). The H-T-P Technique. Journal of Clinical Psychology, Monograph Supplement, 4, 1-120.',
      id_ext: '',
      finding: '房树人测验起源手册。',
      weight: '**历史文献，同上。** 其"房=家庭、树=自我、人=社会我"的对应关系缺乏实证支持。'
    },
    {
      id: 'goodenough1926',
      cite: 'Goodenough, F. L. (1926). Measurement of Intelligence by Drawings. World Book Company.',
      id_ext: '',
      finding: '画人测验最初用于测量儿童认知发展水平。',
      weight: '历史源流。注意：其原始用途是认知测量，与人格投射无关。'
    }
  ],

  /* ───────────── 五、必须防范的认知偏差 ───────────── */
  bias: [
    {
      id: 'forer_barnum',
      cite: 'Snyder, C. R., Shenkel, R. J., & Lowery, C. R. (1977). Acceptance of personality interpretations: The "Barnum Effect" and beyond. Journal of Consulting and Clinical Psychology, 45(1), 104-114.',
      id_ext: 'PMID 321490 · doi:10.1037/0022-006X.45.1.104',
      finding:
        '人们倾向于把模糊、普遍适用的人格描述当作对自己高度准确的刻画，尤其当描述被声称是"为你个人定制"时。',
      weight:
        '**对本系统的直接警示。** 一份写得温暖、笼统、正面的报告，用户几乎必然觉得"好准"。这种"准"是错觉，不能作为系统有效的证据，更不能刻意利用它来提升满意度。'
    },
    {
      id: 'schizotypy_barnum2011',
      cite: 'Schizotypy, self-referential thinking and the Barnum effect. (2011). Journal of Behavior Therapy and Experimental Psychiatry, 42(2), 137-141.',
      id_ext: 'PMID 21315874 · doi:10.1016/j.jbtep.2010.11.003',
      finding: '自我参照思维倾向较强者更易受巴纳姆效应影响。',
      weight: '提示：越是敏感、易自我关联的用户，越容易把泛泛之辞当真——而这类用户往往正是最需要保护的。'
    }
  ],

  /* ───────────── 六、关于"预测/卜卦"的立场 ───────────── */
  divination: {
    stance: 'not_supported',
    statement:
      '经检索，不存在支持"通过绘画预测未来"的同行评议实证研究。绘画无法预测事件、运势或结果。',
    reasoning: [
      '心理学文献中与占卜相关的研究，考察的是"人为何相信占卜"（认知与文化机制），而非"占卜是否准确"。',
      '将系统包装为预测工具，会激活巴纳姆效应（见 bias 部分），使用户把普遍性描述误认为个人化的准确预言。',
      '在心理健康语境下，这不仅是不准确，而且可能造成实际伤害：用户可能据此做出人生决策，或延误真正需要的专业帮助。'
    ],
    handling:
      '若用户询问预测、运势、卜卦类问题，应温和说明本系统不做预测，并把注意力引回"此刻你的感受与处境"——这才是画作真正能承载的内容。'
  }
};

/**
 * 生成注入提示词的证据摘要。
 * 保持精简：目的是给模型立场与边界，不是塞满上下文。
 */
export function buildEvidenceBrief() {
  return `## 你的分析必须建立在以下实证事实之上

**1. 绘画可以作为表达与情绪调节的媒介 —— 这有证据支持**
- Joschko et al. (2024, JAMA Netw Open) 对 69 项 RCT、约 4200 人的元分析：
  艺术治疗在部分结局上优于对照（SMD 0.19~0.38，小到中等效应），
  但 81% 的结局无差异，且整体研究质量偏低。
- Lieberman et al. (2007, Psychological Science)：为情绪命名会降低杏仁核活动。
  → 用户描述自己的感受这个动作本身，就有调节作用。
- Pennebaker 传统的表达性书写研究：结构化的自我表达有健康益处。

**2. 绘画不能用于诊断、评估人格或预测 —— 这已被证伪**
- Lilienfeld, Wood & Garb (2000, Psychol Sci Public Interest)：
  人物画的效度证据比罗夏和 TAT 更薄弱；绝大多数投射指标缺乏实证支持；
  缺乏增量效度。
- Motta, Little & Burns (1993)：特定绘画符号在诊断心理病理时无效。
- 绘画技巧、疲劳、纸笔材质、文化背景都会显著影响画面；
  技巧差常被误判为病理，产生假阳性。
- 投射测验倾向于识别出高于实际的病理率。
→ 因此：**绝不可从线条、颜色、构图、比例推断任何心理状态或人格特质。**
→ 房树人的"房=家庭、树=自我"等对应关系缺乏实证支持，禁止使用。

**3. 你的方法论来自现象学艺术治疗**
- Betensky (1995)：治疗师应"悬置"自身预设，不以专家身份解读，
  而是引导创作者自己观察和描述。
→ 画面观察只用于**描述你看到了什么**，意义必须由创作者赋予。

**4. 必须防范巴纳姆效应**
- Snyder, Shenkel & Lowery (1977)：人们会把模糊、普遍的描述
  当作对自己高度准确的刻画，尤其当它被称为"为你定制"时。
→ 不要写那种"读起来很准"但其实放之四海皆准的句子。
→ 宁可具体到只对这一份画作和这段文字成立，也不要写漂亮的空话。

**5. 关于预测**
不存在支持"绘画能预测未来"的实证研究。若用户询问运势、卜卦、
预测类问题，温和说明本系统不做预测，并把注意力引回此刻的感受与处境。`;
}
