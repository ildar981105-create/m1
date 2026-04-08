#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tideo AI 产品体验验证框架 — PDF 生成器
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black, Color
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Circle
from reportlab.graphics import renderPDF
import os

# ─────────────────── Fonts ───────────────────
pdfmetrics.registerFont(TTFont('CN', '/System/Library/Fonts/STHeiti Medium.ttc', subfontIndex=0))
pdfmetrics.registerFont(TTFont('CN-Light', '/System/Library/Fonts/STHeiti Light.ttc', subfontIndex=0))

# ─────────────────── Colors ───────────────────
C_PRIMARY    = HexColor('#1a1a2e')   # 深藏青
C_ACCENT     = HexColor('#e94560')   # 珊瑚红
C_BLUE       = HexColor('#3b82f6')   # 信任蓝
C_GREEN      = HexColor('#10b981')   # 掌控绿
C_PURPLE     = HexColor('#a855f7')   # 发现紫
C_AMBER      = HexColor('#f59e0b')   # 共鸣金
C_TEAL       = HexColor('#14b8a6')   # 测试青
C_LIGHTBG    = HexColor('#f8f9fc')   # 浅灰背景
C_DARKBG     = HexColor('#16213e')   # 深背景
C_BODY       = HexColor('#333333')   # 正文色
C_MUTED      = HexColor('#666666')   # 辅助文字
C_BORDER     = HexColor('#e2e8f0')   # 边线

# ─────────────────── Styles ───────────────────
def make_styles():
    s = {}
    s['cover_title'] = ParagraphStyle('cover_title', fontName='CN', fontSize=28, leading=38,
                                       textColor=white, alignment=TA_LEFT, spaceAfter=8)
    s['cover_sub'] = ParagraphStyle('cover_sub', fontName='CN-Light', fontSize=14, leading=20,
                                     textColor=HexColor('#ccccdd'), alignment=TA_LEFT)
    s['h1'] = ParagraphStyle('h1', fontName='CN', fontSize=20, leading=28,
                              textColor=C_PRIMARY, spaceBefore=20, spaceAfter=12)
    s['h2'] = ParagraphStyle('h2', fontName='CN', fontSize=15, leading=22,
                              textColor=C_PRIMARY, spaceBefore=16, spaceAfter=8)
    s['h3'] = ParagraphStyle('h3', fontName='CN', fontSize=12, leading=18,
                              textColor=C_PRIMARY, spaceBefore=10, spaceAfter=6)
    s['body'] = ParagraphStyle('body', fontName='CN-Light', fontSize=10, leading=16,
                                textColor=C_BODY, spaceAfter=6)
    s['body_sm'] = ParagraphStyle('body_sm', fontName='CN-Light', fontSize=9, leading=14,
                                   textColor=C_BODY, spaceAfter=4)
    s['quote'] = ParagraphStyle('quote', fontName='CN-Light', fontSize=10, leading=16,
                                 textColor=C_MUTED, leftIndent=16, borderPadding=8,
                                 spaceAfter=8, spaceBefore=4)
    s['formula'] = ParagraphStyle('formula', fontName='CN', fontSize=13, leading=20,
                                   textColor=C_PRIMARY, alignment=TA_CENTER,
                                   spaceBefore=12, spaceAfter=12)
    s['toc'] = ParagraphStyle('toc', fontName='CN-Light', fontSize=11, leading=20,
                               textColor=C_BODY, leftIndent=12, spaceAfter=2)
    s['cell'] = ParagraphStyle('cell', fontName='CN-Light', fontSize=8.5, leading=13,
                                textColor=C_BODY, alignment=TA_LEFT)
    s['cell_c'] = ParagraphStyle('cell_c', fontName='CN-Light', fontSize=8.5, leading=13,
                                  textColor=C_BODY, alignment=TA_CENTER)
    s['cell_h'] = ParagraphStyle('cell_h', fontName='CN', fontSize=8.5, leading=13,
                                  textColor=white, alignment=TA_CENTER)
    s['cell_h_l'] = ParagraphStyle('cell_h_l', fontName='CN', fontSize=8.5, leading=13,
                                    textColor=white, alignment=TA_LEFT)
    s['tag'] = ParagraphStyle('tag', fontName='CN', fontSize=9, leading=14,
                               textColor=white, alignment=TA_CENTER)
    s['footer'] = ParagraphStyle('footer', fontName='CN-Light', fontSize=7.5, leading=10,
                                  textColor=C_MUTED, alignment=TA_CENTER)
    return s

# ─────────────────── Helpers ───────────────────
def colored_bar(color, width=480, height=4):
    d = Drawing(width, height)
    d.add(Rect(0, 0, width, height, fillColor=color, strokeColor=None))
    return d

def section_divider(color=C_BORDER):
    return HRFlowable(width='100%', thickness=0.5, color=color, spaceBefore=10, spaceAfter=10)

def make_table(headers, rows, col_widths, header_color=C_PRIMARY):
    """Build a styled table with Paragraph cells."""
    S = make_styles()
    data = [[Paragraph(h, S['cell_h']) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), S['cell']) for c in row])
    
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), header_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, -1), 'CN-Light'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('LEADING', (0, 0), (-1, -1), 13),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, C_LIGHTBG]),
    ]
    t.setStyle(TableStyle(style_cmds))
    return t

def dim_card(color, emoji, title, subtitle, desc, width=108):
    """Single dimension card as a table cell."""
    S = make_styles()
    content = f"""<font size="18">{emoji}</font><br/>
<font name="CN" size="10" color="{color}">{title}</font><br/>
<font name="CN-Light" size="7" color="#666666">{subtitle}</font><br/><br/>
<font name="CN-Light" size="8" color="#333333">{desc}</font>"""
    style = ParagraphStyle('card', fontName='CN-Light', fontSize=8, leading=12,
                           textColor=C_BODY, alignment=TA_CENTER)
    return Paragraph(content, style)

def page_number(canvas, doc):
    """Add page number and footer."""
    canvas.saveState()
    canvas.setFont('CN-Light', 7.5)
    canvas.setFillColor(C_MUTED)
    canvas.drawCentredString(A4[0]/2, 18*mm, f'Tideo AI 产品体验验证框架  —  {doc.page}')
    canvas.restoreState()

# ─────────────────── PDF Build ───────────────────
def build_pdf():
    output_path = os.path.join(os.path.dirname(__file__), 'app', 'tideo-experience-framework.pdf')
    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=25*mm, rightMargin=25*mm,
        topMargin=22*mm, bottomMargin=25*mm
    )
    S = make_styles()
    W = doc.width  # usable width
    story = []

    # ═══════════════════════════════════════
    # COVER PAGE
    # ═══════════════════════════════════════
    # Dark background block via table
    cover_content = [
        [Paragraph(' ', ParagraphStyle('sp', fontSize=60, leading=60))],
        [Paragraph('Tideo', ParagraphStyle('logo', fontName='CN', fontSize=42, leading=50, textColor=HexColor('#e94560')))],
        [Paragraph('AI 产品体验验证框架', S['cover_title'])],
        [Paragraph(' ', ParagraphStyle('sp2', fontSize=8, leading=8))],
        [Paragraph('可信任  ·  可掌控  ·  可找到  ·  可共鸣', 
                   ParagraphStyle('dims', fontName='CN-Light', fontSize=14, leading=20, textColor=HexColor('#aabbdd')))],
        [Paragraph(' ', ParagraphStyle('sp3', fontSize=30, leading=30))],
        [Paragraph('把复杂音视频 API 能力，转化为<br/>普通业务用户也能理解、能完成、愿复用的产品体验',
                   ParagraphStyle('mission', fontName='CN-Light', fontSize=11, leading=18, textColor=HexColor('#99aabb')))],
        [Paragraph(' ', ParagraphStyle('sp4', fontSize=40, leading=40))],
        [Paragraph('2026 年 4 月  ·  v1.0',
                   ParagraphStyle('date', fontName='CN-Light', fontSize=10, leading=14, textColor=HexColor('#667788')))],
    ]
    cover_table = Table(cover_content, colWidths=[W])
    cover_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_DARKBG),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 24),
        ('RIGHTPADDING', (0, 0), (-1, -1), 24),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
    ]))
    story.append(cover_table)
    story.append(PageBreak())

    # ═══════════════════════════════════════
    # TABLE OF CONTENTS
    # ═══════════════════════════════════════
    story.append(Paragraph('目录', S['h1']))
    story.append(colored_bar(C_ACCENT, width=W))
    story.append(Spacer(1, 8))
    toc_items = [
        ('01', '项目背景与业务目标'),
        ('02', '验证体系总览'),
        ('03', '数据验证：埋点指标体系'),
        ('04', 'AI 体验四维验证模型'),
        ('05', '第一维：可信任 Trust'),
        ('06', '第二维：可掌控 Control'),
        ('07', '第三维：可找到 Findability'),
        ('08', '第四维：可共鸣 Emotional Bond'),
        ('09', '可用性测试方案'),
        ('10', '验证指标汇总与执行计划'),
        ('11', '总结：四维公式'),
    ]
    for num, title in toc_items:
        story.append(Paragraph(f'<font name="CN" color="{C_ACCENT.hexval()}">{num}</font>  {title}', S['toc']))
    story.append(PageBreak())

    # ═══════════════════════════════════════
    # 01 - PROJECT BACKGROUND
    # ═══════════════════════════════════════
    story.append(Paragraph('01  项目背景与业务目标', S['h1']))
    story.append(colored_bar(C_BLUE, width=W))
    story.append(Spacer(1, 6))
    
    story.append(Paragraph('<b>业务目标</b>', S['h3']))
    # Quote box
    quote_data = [[Paragraph(
        '把原本依赖 API 对接的复杂音视频能力，转化为普通业务用户也能理解、能完成、愿复用的产品体验。',
        ParagraphStyle('qp', fontName='CN', fontSize=11, leading=18, textColor=C_PRIMARY)
    )]]
    qt = Table(quote_data, colWidths=[W - 20])
    qt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#eef2ff')),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
    ]))
    story.append(qt)
    story.append(Spacer(1, 10))

    story.append(Paragraph('这意味着三层转化：', S['body']))
    transform_data = [
        ['转化层级', '从', '到', '验证问题'],
        ['能理解', '看 API 文档', '看界面就知道能做什么', '用户是否能找到功能入口？'],
        ['能完成', '写代码调接口', '上传视频 → 配置 → 等待 → 拿结果', '用户是否能自主完成全流程？'],
        ['愿复用', '每次重新对接', '记住体验 → 主动回来', '用户完成后是否有正向感受？'],
    ]
    t = Table(transform_data, colWidths=[W*0.15, W*0.2, W*0.3, W*0.35])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'CN'),
        ('FONTNAME', (0, 1), (-1, -1), 'CN-Light'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('LEADING', (0, 0), (-1, -1), 14),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, C_LIGHTBG]),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    story.append(Paragraph('<b>产品概述</b>', S['h3']))
    story.append(Paragraph(
        'Tideo 是一款面向业务用户的 AI 视频译制工具，将字幕擦除、翻译、配音等复杂音视频处理能力，'
        '封装为角色化、游戏化的协作体验。用户上传视频后，由四位 AI 角色（导演·林雨晨、后期·陈默、'
        '翻译·李明远、配音·苏雅）协同完成处理，全程可见、可控、可精调。', S['body']
    ))
    story.append(PageBreak())

    # ═══════════════════════════════════════
    # 02 - VERIFICATION SYSTEM OVERVIEW
    # ═══════════════════════════════════════
    story.append(Paragraph('02  验证体系总览', S['h1']))
    story.append(colored_bar(C_ACCENT, width=W))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        '我们从<b>三个互补方向</b>验证产品体验是否达标，形成"定量 + 定性 + 实测"的完整证据链：',
        S['body']))
    story.append(Spacer(1, 6))
    
    # Three pillars
    pillar_data = [
        [Paragraph('<font name="CN" color="#ffffff">方向一：埋点数据</font>', S['cell_h']),
         Paragraph('<font name="CN" color="#ffffff">方向二：AI 体验四维模型</font>', S['cell_h']),
         Paragraph('<font name="CN" color="#ffffff">方向三：可用性测试</font>', S['cell_h'])],
        [Paragraph('基于用户行为数据的<b>定量验证</b><br/><br/>'
                   '核心指标：自助任务完成率<br/>'
                   '辅助指标：步骤流失率、精调使用率、复访率', S['cell']),
         Paragraph('基于产品设计理念的<b>定性分析</b><br/><br/>'
                   '可信任 — 敢交给 AI<br/>'
                   '可掌控 — 能干预结果<br/>'
                   '可找到 — 能发现功能<br/>'
                   '可共鸣 — 过程有温度', S['cell']),
         Paragraph('基于真实用户的<b>实测验证</b><br/><br/>'
                   '招募典型用户执行任务<br/>'
                   '观察操作行为 + 记录主观感受<br/>'
                   '验证四维模型的实际体验落地', S['cell'])],
    ]
    pt = Table(pillar_data, colWidths=[W/3, W/3, W/3])
    pt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), C_BLUE),
        ('BACKGROUND', (1, 0), (1, 0), C_PURPLE),
        ('BACKGROUND', (2, 0), (2, 0), C_TEAL),
        ('BACKGROUND', (0, 1), (0, 1), HexColor('#eff6ff')),
        ('BACKGROUND', (1, 1), (1, 1), HexColor('#faf5ff')),
        ('BACKGROUND', (2, 1), (2, 1), HexColor('#f0fdfa')),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(pt)
    story.append(Spacer(1, 12))

    story.append(Paragraph(
        '三个方向互为补充：埋点告诉我们<b>"发生了什么"</b>，四维模型帮我们理解<b>"为什么这样设计"</b>，'
        '可用性测试验证<b>"用户实际感受如何"</b>。',
        S['body']))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # 03 - DATA METRICS
    # ═══════════════════════════════════════
    story.append(Paragraph('03  数据验证：埋点指标体系', S['h1']))
    story.append(colored_bar(C_GREEN, width=W))
    story.append(Spacer(1, 6))

    story.append(Paragraph('<b>核心指标：自助任务完成率</b>', S['h2']))
    story.append(Paragraph(
        '定义：用户从上传视频到获得最终成片，全程无需人工介入的任务占比。这是衡量"能完成"最直接的量化标准。',
        S['body']))
    story.append(Spacer(1, 6))

    metric_data = [
        ['指标', '定义', '目标', '采集方式'],
        ['任务完成率', '成功走完全流程的任务 / 总任务数', '> 80%', '任务状态埋点'],
        ['步骤流失率', '每步骤开始→完成的流失比例', '每步 < 10%', '步骤状态变更事件'],
        ['精调使用率', '进入精调面板的用户占比', '> 40%', '面板打开事件'],
        ['精调修改率', '在精调中实际做了修改的占比', '> 60%（精调者中）', '编辑操作事件'],
        ['对比模式使用率', '完成后查看对比的用户占比', '> 30%', '对比按钮点击'],
        ['平均任务时长', '上传到最终导出的耗时', '< 10 分钟', '时间戳计算'],
        ['复访率（7日）', '7 天内再次使用的用户占比', '> 25%', '用户回访日志'],
    ]
    story.append(make_table(
        metric_data[0], metric_data[1:],
        [W*0.18, W*0.35, W*0.18, W*0.29],
        header_color=C_GREEN
    ))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph('<b>漏斗模型</b>', S['h3']))
    story.append(Paragraph(
        '用户行为漏斗：访问页面 → 上传视频 → 配置参数 → 等待处理 → 查看结果 → 精调/导出 → 复访',
        S['body']))
    story.append(Paragraph(
        '每一层的流失率都需要独立追踪，以定位体验瓶颈。特别关注"配置参数→等待处理"'
        '（是否理解配置项）和"等待处理→查看结果"（是否因等待过长放弃）两个关键节点。',
        S['body']))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # 04 - FOUR DIMENSIONS OVERVIEW
    # ═══════════════════════════════════════
    story.append(Paragraph('04  AI 体验四维验证模型', S['h1']))
    story.append(colored_bar(C_ACCENT, width=W))
    story.append(Spacer(1, 6))
    
    story.append(Paragraph(
        '面对 AI 产品，用户从"能用"到"想用"需要跨越四个体验维度。每个维度回答一个关键问题：',
        S['body']))
    story.append(Spacer(1, 8))

    # Four dimension cards
    card_data = [
        [Paragraph(
            '<font name="CN" size="16" color="#3b82f6">&#9632;</font><br/>'
            '<font name="CN" size="11" color="#3b82f6">可信任</font><br/>'
            '<font name="CN-Light" size="7.5" color="#666666">Trust</font><br/><br/>'
            '<font name="CN-Light" size="8.5" color="#333333">敢不敢把任务<br/>交给 AI？</font><br/><br/>'
            '<font name="CN-Light" size="7.5" color="#3b82f6">能用 →</font>',
            ParagraphStyle('c1', fontName='CN-Light', fontSize=8.5, leading=13, alignment=TA_CENTER)),
         Paragraph(
            '<font name="CN" size="16" color="#10b981">&#9632;</font><br/>'
            '<font name="CN" size="11" color="#10b981">可掌控</font><br/>'
            '<font name="CN-Light" size="7.5" color="#666666">Control</font><br/><br/>'
            '<font name="CN-Light" size="8.5" color="#333333">能不能干预<br/>AI 的结果？</font><br/><br/>'
            '<font name="CN-Light" size="7.5" color="#10b981">敢用 →</font>',
            ParagraphStyle('c2', fontName='CN-Light', fontSize=8.5, leading=13, alignment=TA_CENTER)),
         Paragraph(
            '<font name="CN" size="16" color="#a855f7">&#9632;</font><br/>'
            '<font name="CN" size="11" color="#a855f7">可找到</font><br/>'
            '<font name="CN-Light" size="7.5" color="#666666">Findability</font><br/><br/>'
            '<font name="CN-Light" size="8.5" color="#333333">能不能找到<br/>想要的功能？</font><br/><br/>'
            '<font name="CN-Light" size="7.5" color="#a855f7">会用 →</font>',
            ParagraphStyle('c3', fontName='CN-Light', fontSize=8.5, leading=13, alignment=TA_CENTER)),
         Paragraph(
            '<font name="CN" size="16" color="#f59e0b">&#9632;</font><br/>'
            '<font name="CN" size="11" color="#f59e0b">可共鸣</font><br/>'
            '<font name="CN-Light" size="7.5" color="#666666">Emotional Bond</font><br/><br/>'
            '<font name="CN-Light" size="8.5" color="#333333">过程是否<br/>有温度？</font><br/><br/>'
            '<font name="CN-Light" size="7.5" color="#f59e0b">想用</font>',
            ParagraphStyle('c4', fontName='CN-Light', fontSize=8.5, leading=13, alignment=TA_CENTER)),
        ]
    ]
    ct = Table(card_data, colWidths=[W/4]*4)
    ct.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), HexColor('#eff6ff')),
        ('BACKGROUND', (1, 0), (1, 0), HexColor('#ecfdf5')),
        ('BACKGROUND', (2, 0), (2, 0), HexColor('#faf5ff')),
        ('BACKGROUND', (3, 0), (3, 0), HexColor('#fffbeb')),
        ('BOX', (0, 0), (0, 0), 1, C_BLUE),
        ('BOX', (1, 0), (1, 0), 1, C_GREEN),
        ('BOX', (2, 0), (2, 0), 1, C_PURPLE),
        ('BOX', (3, 0), (3, 0), 1, C_AMBER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(ct)
    story.append(Spacer(1, 12))

    story.append(Paragraph(
        '前三个维度解决<b>功能性体验</b>（用户能否完成任务），'
        '第四个维度"可共鸣"解决<b>复用动机</b>（用户是否愿意回来）。'
        '四个维度形成完整的转化链路：能用 → 敢用 → 会用 → 想用。', S['body']))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # 05 - TRUST
    # ═══════════════════════════════════════
    story.append(Paragraph('05  第一维：可信任 Trust', S['h1']))
    story.append(colored_bar(C_BLUE, width=W))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        '<b>核心问题：</b>用户敢不敢把自己的视频交给 AI 处理？<br/>'
        '<b>设计策略：</b>通过透明化、人格化、专业化建立信任。', S['body']))
    story.append(Spacer(1, 6))

    trust_data = [
        ['设计策略', '产品实现', '信任机制'],
        ['角色人格化', '四位有真名、有专业的 AI 角色（林雨晨/陈默/李明远/苏雅）', '从"系统在处理"变成"有人在帮我"'],
        ['过程透明化', '子任务实时拆解：场景检测→文字定位→内容擦除→画面修复', '用户能看到 AI 在做什么，不是黑盒'],
        ['进度可视化', '角色进度卡片 + 状态点（pending/active/done）', '等待不焦虑，每一步都有反馈'],
        ['专业台词', '角色说专业但不晦涩的话："信达雅三字，达意之外还要通顺"', '让用户相信 AI 真的理解内容'],
        ['导演调度', '林雨晨统筹全局："陈默开路，明远跟上，苏雅收尾"', '有组织感 = 有可靠感'],
    ]
    story.append(make_table(
        trust_data[0], trust_data[1:],
        [W*0.15, W*0.45, W*0.4],
        header_color=C_BLUE
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        '<b>验证指标：</b>任务启动率（上传后是否继续）、等待期间页面停留率（是否信任到愿意等）、'
        '首次使用完成率。', S['body']))
    story.append(PageBreak())

    # ═══════════════════════════════════════
    # 06 - CONTROL
    # ═══════════════════════════════════════
    story.append(Paragraph('06  第二维：可掌控 Control', S['h1']))
    story.append(colored_bar(C_GREEN, width=W))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        '<b>核心问题：</b>如果 AI 的结果不满意，用户能不能修改？<br/>'
        '<b>设计策略：</b>提供多层次、低门槛的精调能力。', S['body']))
    story.append(Spacer(1, 6))

    ctrl_data = [
        ['精调层级', '操作方式', '适用场景'],
        ['擦除区域调整', '视频上直接拖拽 8 个 resize handle 调整区域框', 'AI 没擦干净或擦多了'],
        ['字幕逐条编辑', '精调面板列表 → 点击编辑 → 修改译文/时间', '翻译不准确、时间不对'],
        ['配音逐条编辑', '精调面板列表 → 编辑译文/起止时间', '配音语气或时长需调整'],
        ['对比验证', '原片/成片上下对比播放', '确认 AI 处理效果'],
        ['重新生成', '单步骤重新处理（不需要全部重做）', '整体效果不满意'],
    ]
    story.append(make_table(
        ctrl_data[0], ctrl_data[1:],
        [W*0.2, W*0.42, W*0.38],
        header_color=C_GREEN
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        '<b>验证指标：</b>精调面板打开率、精调中实际修改率、修改后满意度（是否导出）。', S['body']))
    story.append(PageBreak())

    # ═══════════════════════════════════════
    # 07 - FINDABILITY
    # ═══════════════════════════════════════
    story.append(Paragraph('07  第三维：可找到 Findability', S['h1']))
    story.append(colored_bar(C_PURPLE, width=W))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        '<b>核心问题：</b>用户能不能找到想要的功能？<br/>'
        '<b>设计策略：</b>多入口、渐进式披露、智能意图检测。', S['body']))
    story.append(Spacer(1, 6))

    find_data = [
        ['入口类型', '实现方式', '解决的问题'],
        ['路径标签', 'Landing 页顶部：新任务 / 导入', '用户第一眼就知道有两种方式'],
        ['模式标签', '完整 / 字幕擦除 / 翻译 / 配音', '不是所有用户都需要全部功能'],
        ['配置面板', '按模式动态展示相关配置项', '减少认知负担，只看相关的'],
        ['智能输入', '底部输入框支持自然语言意图检测', '"帮我把这个视频翻译成英文"→自动路由'],
        ['导入面板', 'ID 查询 / 文件上传 / 历史列表', '多种找回旧任务的方式'],
    ]
    story.append(make_table(
        find_data[0], find_data[1:],
        [W*0.15, W*0.42, W*0.43],
        header_color=C_PURPLE
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        '<b>验证指标：</b>功能入口点击分布、智能输入使用率、'
        '用户是否需要帮助/FAQ 才能完成首次任务。', S['body']))
    story.append(PageBreak())

    # ═══════════════════════════════════════
    # 08 - EMOTIONAL BOND (Deep Dive)
    # ═══════════════════════════════════════
    story.append(Paragraph('08  第四维：可共鸣 Emotional Bond', S['h1']))
    story.append(colored_bar(C_AMBER, width=W))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        '<b>核心问题：</b>用户在等待和操作过程中，感受到的不是焦虑和无聊，而是有人陪着在做。<br/><br/>'
        '<b>为什么叫"可共鸣"而不是"有趣"：</b>"有趣"太泛，容易跑偏成"为了趣味而趣味"。'
        '"可共鸣"是双向的——不是产品单方面讨好用户，而是用户在角色身上看到了"人"的痕迹，产生了情感投射。'
        '它和业务目标强绑定：用户"愿复用"的前提之一就是过程不痛苦。', S['body']))
    story.append(Spacer(1, 8))

    # Layer 1
    story.append(Paragraph('<font name="CN" color="#f59e0b">Layer 1</font>  角色人格化 — 让 AI 不像机器', S['h2']))
    l1_data = [
        ['设计点', '实现方式', '情绪作用'],
        ['四角色有真名', '林雨晨 / 陈默 / 李明远 / 苏雅', '从"系统在处理"变成"有人在帮我"'],
        ['性格差异化', '陈默寡言："……坐标锁定。开始抠。"\n苏雅活泼："来啦来啦～"', '角色不是皮肤，是有辨识度的"人"'],
        ['专业台词', '"信达雅三字，达意之外还要通顺"', '让用户相信背后的 AI 在"理解"内容'],
        ['随机问候', '每角色 3 句问候语随机选择', '每次体验有微妙差异，不机械'],
    ]
    story.append(make_table(l1_data[0], l1_data[1:], [W*0.18, W*0.42, W*0.4], header_color=C_AMBER))
    story.append(Spacer(1, 10))

    # Layer 2
    story.append(Paragraph('<font name="CN" color="#f59e0b">Layer 2</font>  等待体验游戏化 — 把焦虑变成观赏', S['h2']))
    l2_data = [
        ['设计点', '实现方式', '情绪作用'],
        ['视频 Loading 覆盖层', '擦除/字幕 → translate-loading.mp4\n配音 → voice-loading.mp4', '等待不是空白进度条，是"角色在工作"'],
        ['台词轮播', '每角色 7 条工作台词，定时切换', '等待时有"故事感"，像在看幕后花絮'],
        ['像素工作室', '480x360 canvas 星露谷风格场景', '审美情趣的共鸣——像游戏，不像工具'],
        ['角色行走动画', '角色在工作室中走动、召唤、对话', '动态感，角色"活着"'],
    ]
    story.append(make_table(l2_data[0], l2_data[1:], [W*0.18, W*0.42, W*0.4], header_color=C_AMBER))
    story.append(Spacer(1, 10))

    # Layer 3
    story.append(Paragraph('<font name="CN" color="#f59e0b">Layer 3</font>  协作叙事感 — 让流程变成故事', S['h2']))
    l3_data = [
        ['设计点', '实现方式', '情绪作用'],
        ['导演调度台词', '"陈默开路，明远跟上，苏雅收尾"', '用户不是在操作系统，是在看团队协作'],
        ['步骤接力', '擦除→字幕→配音，每步有角色交接', '叙事弧线——开场→推进→高潮→收尾'],
        ['杀青仪式', '"各位——杀青了" + 关灯聚光效果', '完成感的仪式化放大'],
        ['聊天时间线', '加入→问候→进度→结果', '回溯时像完整的"协作记录"'],
    ]
    story.append(make_table(l3_data[0], l3_data[1:], [W*0.18, W*0.42, W*0.4], header_color=C_AMBER))
    story.append(Spacer(1, 10))

    # Layer 4
    story.append(Paragraph('<font name="CN" color="#f59e0b">Layer 4</font>  完成仪式化 — 把结果变成成就', S['h2']))
    l4_data = [
        ['设计点', '实现方式', '情绪作用'],
        ['关灯聚光灯', '暗幕遮罩 + 视频发光 + 渐入动画', '电影首映式——"这是你的作品"'],
        ['对比模式', '原片/成片上下对比同步播放', '成就感——"AI 真的帮我完成了这么多"'],
        ['步骤完成闪光', 'CSS 闪光 + 刷新动画', '正反馈微交互——每步都有"成了！"'],
    ]
    story.append(make_table(l4_data[0], l4_data[1:], [W*0.18, W*0.42, W*0.4], header_color=C_AMBER))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # 09 - USABILITY TESTING
    # ═══════════════════════════════════════
    story.append(Paragraph('09  可用性测试方案', S['h1']))
    story.append(colored_bar(C_TEAL, width=W))
    story.append(Spacer(1, 6))

    story.append(Paragraph('<b>测试目标</b>', S['h2']))
    story.append(Paragraph(
        '通过真实用户的操作观察与感受访谈，验证四维体验模型的实际落地效果。'
        '重点回答两个核心问题：', S['body']))
    
    goal_data = [[
        Paragraph(
            '<font name="CN" size="10" color="#14b8a6">Q1 行为层面</font><br/><br/>'
            '<font name="CN-Light" size="9.5">用户能否自主、顺利地<br/>完成完整的视频译制流程？</font><br/><br/>'
            '<font name="CN-Light" size="8" color="#666666">对应维度：可信任 + 可掌控 + 可找到</font>',
            ParagraphStyle('g1', fontName='CN-Light', fontSize=9, leading=14, alignment=TA_CENTER)),
        Paragraph(
            '<font name="CN" size="10" color="#f59e0b">Q2 感受层面</font><br/><br/>'
            '<font name="CN-Light" size="9.5">用户在过程中的情绪感受<br/>是正向的还是负向的？</font><br/><br/>'
            '<font name="CN-Light" size="8" color="#666666">对应维度：可共鸣</font>',
            ParagraphStyle('g2', fontName='CN-Light', fontSize=9, leading=14, alignment=TA_CENTER)),
    ]]
    gt = Table(goal_data, colWidths=[W/2, W/2])
    gt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), HexColor('#f0fdfa')),
        ('BACKGROUND', (1, 0), (1, 0), HexColor('#fffbeb')),
        ('BOX', (0, 0), (0, 0), 1, C_TEAL),
        ('BOX', (1, 0), (1, 0), 1, C_AMBER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(gt)
    story.append(Spacer(1, 12))

    # Participants
    story.append(Paragraph('<b>参与者招募</b>', S['h2']))
    story.append(Paragraph(
        '由产品经理协调招募典型用户，确保覆盖目标用户画像的多样性：', S['body']))
    
    recruit_data = [
        ['用户类型', '画像特征', '招募数量', '验证重点'],
        ['业务运营人员', '非技术背景，日常使用办公软件，有视频翻译需求', '2-3 人', '可找到 + 可信任'],
        ['内容创作者', '有视频剪辑经验，对画质/配音有要求', '1-2 人', '可掌控 + 精调体验'],
        ['产品/项目经理', '需要评估工具能力，关注效率和效果', '1-2 人', '全流程完成度'],
    ]
    story.append(make_table(
        recruit_data[0], recruit_data[1:],
        [W*0.17, W*0.38, W*0.13, W*0.32],
        header_color=C_TEAL
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        '<b>建议总人数：</b>5-6 人。可用性测试领域的共识是 5 个用户能发现约 85% 的可用性问题（Nielsen, 2000）。',
        S['body']))
    story.append(Spacer(1, 12))

    # Test tasks
    story.append(Paragraph('<b>测试任务设计</b>', S['h2']))
    story.append(Paragraph(
        '每位参与者依次执行以下任务，测试员仅在用户明确求助时才介入（"think aloud"协议）：', S['body']))
    story.append(Spacer(1, 4))

    task_data = [
        ['任务编号', '任务描述', '对应维度', '观察要点'],
        ['T1\n找到功能', '"请在这个网站上找到视频翻译功能，\n并开始一个新任务"', '可找到', '入口是否清晰？\n需要几次点击？'],
        ['T2\n上传配置', '"上传提供的测试视频，\n选择完整翻译模式，开始处理"', '可找到\n可信任', '上传流程是否顺畅？\n配置项是否理解？'],
        ['T3\n等待观察', '"请等待 AI 处理完成，\n期间你可以自由浏览页面"', '可信任\n可共鸣', '是否切走？是否看角色对话？\n等待时的情绪？'],
        ['T4\n查看结果', '"处理完成后，查看 AI 的处理结果"', '可信任', '是否理解结果展示？\n对聚光灯效果的反应？'],
        ['T5\n精调操作', '"请修改第 3 条字幕的翻译，\n并调整一个擦除区域的位置"', '可掌控', '能否找到精调入口？\n操作是否直觉？'],
        ['T6\n对比导出', '"对比原片和成片效果，\n然后导出最终视频"', '可掌控', '对比功能是否被发现？\n导出流程是否完整？'],
    ]
    story.append(make_table(
        task_data[0], task_data[1:],
        [W*0.11, W*0.33, W*0.13, W*0.43],
        header_color=C_TEAL
    ))
    
    story.append(PageBreak())

    # Test flow
    story.append(Paragraph('<b>测试流程</b>', S['h2']))
    
    flow_data = [
        ['阶段', '时长', '内容', '记录方式'],
        ['开场介绍', '5 分钟', '说明测试目的（测产品不测人）、签署知情同意、\n开启录屏', '录屏软件'],
        ['自由探索', '3 分钟', '用户自由浏览页面，说出第一印象', '观察笔记 + 录屏'],
        ['任务执行', '20-30 分钟', '依次执行 T1-T6，全程 think aloud\n（边操作边说出想法）', '操作录屏 + 观察笔记\n+ 计时'],
        ['半结构化访谈', '10-15 分钟', '针对体验感受进行深度访谈\n（见下方访谈提纲）', '录音 + 笔记'],
        ['问卷填写', '5 分钟', 'SUS 量表 + 情感体验评分 + NPS', '问卷工具'],
    ]
    story.append(make_table(
        flow_data[0], flow_data[1:],
        [W*0.14, W*0.12, W*0.42, W*0.32],
        header_color=C_TEAL
    ))
    story.append(Spacer(1, 12))

    # Interview guide
    story.append(Paragraph('<b>半结构化访谈提纲</b>', S['h2']))
    story.append(Paragraph(
        '访谈围绕四维模型设计，每个维度对应 2-3 个核心问题：', S['body']))
    story.append(Spacer(1, 4))

    interview_data = [
        ['维度', '访谈问题', '探测目标'],
        ['可信任', '"你第一次看到 AI 开始处理时，心里是什么感觉？"\n"你觉得这些 AI 角色可靠吗？为什么？"',
         '用户对 AI 的初始信任度\n角色系统是否建立了信任'],
        ['可掌控', '"如果结果不满意，你知道怎么修改吗？"\n"精调操作的时候，你觉得容易还是困难？"\n"你觉得自己对结果有多大的控制权？"',
         '精调功能的可发现性\n操作难度感知\n掌控感是否到位'],
        ['可找到', '"有没有哪个功能你想用但找不到？"\n"第一次进入页面时，你知道该从哪里开始吗？"',
         '信息架构的清晰度\n首次使用引导效果'],
        ['可共鸣', '"等待处理的时候你在干什么？感受如何？"\n"你对页面上的角色们有什么印象？"\n"完成后看到聚光灯效果时，你的反应是什么？"\n"如果用三个词形容这次体验，你会说什么？"',
         '等待体验质量\n角色感知度\n仪式感效果\n整体情绪基调'],
    ]
    story.append(make_table(
        interview_data[0], interview_data[1:],
        [W*0.12, W*0.52, W*0.36],
        header_color=C_TEAL
    ))
    story.append(Spacer(1, 12))

    # Metrics collection
    story.append(Paragraph('<b>测试数据采集</b>', S['h2']))
    
    collect_data = [
        ['数据类型', '采集方式', '分析方法'],
        ['任务完成率', '每个任务：成功/失败/需要帮助', '按任务统计完成率，定位瓶颈步骤'],
        ['任务耗时', '每个任务的起止时间', '与预期时间对比，识别卡点'],
        ['操作路径', '录屏回看 + 操作日志', '绘制用户实际路径 vs 预期路径'],
        ['错误次数', '误操作、回退、求助的次数', '高频错误 → 对应界面改进点'],
        ['SUS 评分', '10 题标准化量表', '评分 > 68 为可接受，> 80 为优秀'],
        ['情感评分', '四维各打 1-5 分', '每维度平均分 + 最低分维度'],
        ['NPS 净推荐值', '"你会推荐这个产品吗？0-10"', 'NPS = 推荐者% - 贬损者%'],
        ['开放题关键词', '三词描述 + 访谈关键句', '情感词云 + 高频主题聚类'],
    ]
    story.append(make_table(
        collect_data[0], collect_data[1:],
        [W*0.18, W*0.4, W*0.42],
        header_color=C_TEAL
    ))
    story.append(Spacer(1, 12))

    # Analysis framework
    story.append(Paragraph('<b>分析与输出</b>', S['h2']))
    story.append(Paragraph(
        '测试结束后，产出以下交付物：', S['body']))
    
    output_data = [
        ['交付物', '内容', '用途'],
        ['可用性问题清单', '按严重程度（P0-P3）分级的问题列表，\n每个问题附场景截图 + 改进建议', '指导迭代优先级'],
        ['四维评分雷达图', '每个维度的平均分可视化，\n直观展示体验强项和短板', '向上汇报 + 团队对齐'],
        ['用户旅程热力图', '标注情绪高点/低点的全流程地图', '识别关键体验时刻'],
        ['关键发现报告', '5-8 条核心 insight，\n每条附数据支撑 + 用户原话', '产品决策依据'],
        ['迭代建议排序', '基于"影响面 × 实现成本"的优先级矩阵', '开发排期参考'],
    ]
    story.append(make_table(
        output_data[0], output_data[1:],
        [W*0.2, W*0.44, W*0.36],
        header_color=C_TEAL
    ))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # 10 - METRICS SUMMARY
    # ═══════════════════════════════════════
    story.append(Paragraph('10  验证指标汇总与执行计划', S['h1']))
    story.append(colored_bar(C_PRIMARY, width=W))
    story.append(Spacer(1, 6))

    story.append(Paragraph('<b>埋点指标 × 四维度映射</b>', S['h2']))
    summary_data = [
        ['维度', '行为指标（埋点）', '主观指标（测试/问卷）', '目标'],
        ['可信任', '任务启动率\n等待期页面停留率\n首次完成率', 
         'SUS 评分中信任题项\n"你觉得 AI 可靠吗？"', '启动率 > 90%\n停留率 > 70%'],
        ['可掌控', '精调面板打开率\n精调修改率\n修改后导出率',
         '"你觉得能控制结果吗？"\n操作难度评分', '打开率 > 40%\n修改率 > 60%'],
        ['可找到', '功能入口分布\n智能输入使用率\n帮助/FAQ 触发率',
         '"有没有想用但找不到的功能？"\n任务 T1 完成时间', 'T1 < 30秒\n帮助率 < 15%'],
        ['可共鸣', '聊天面板浏览率\n等待切走率\n对比模式使用率\n复访率',
         '"三个词描述体验"\n等待感受评分\n角色辨识度', '切走率 < 30%\n复访率 > 25%'],
    ]
    story.append(make_table(
        summary_data[0], summary_data[1:],
        [W*0.1, W*0.3, W*0.35, W*0.25],
        header_color=C_PRIMARY
    ))
    story.append(Spacer(1, 16))

    story.append(Paragraph('<b>执行时间线</b>', S['h2']))
    timeline_data = [
        ['阶段', '时间', '交付物'],
        ['埋点方案设计', '第 1 周', '埋点需求文档 + 事件列表'],
        ['埋点开发上线', '第 2-3 周', '埋点代码 + 数据看板'],
        ['测试方案定稿', '第 2 周', '测试脚本 + 问卷 + 招募启动'],
        ['用户招募', '第 2-3 周', '5-6 名参与者确认'],
        ['可用性测试执行', '第 4 周', '测试录屏 + 原始数据'],
        ['数据分析 + 报告', '第 5 周', '完整验证报告 + 迭代建议'],
        ['迭代优化启动', '第 6 周', '基于报告的优化方案'],
    ]
    story.append(make_table(
        timeline_data[0], timeline_data[1:],
        [W*0.25, W*0.2, W*0.55],
        header_color=C_PRIMARY
    ))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # 11 - CONCLUSION
    # ═══════════════════════════════════════
    story.append(Paragraph('11  总结', S['h1']))
    story.append(colored_bar(C_ACCENT, width=W))
    story.append(Spacer(1, 10))

    story.append(Paragraph('<b>四维公式</b>', S['h2']))
    # Formula box
    formula_box = [[Paragraph(
        '<font name="CN" size="14" color="#1a1a2e">'
        '<font color="#3b82f6">可信任</font> x '
        '<font color="#10b981">可掌控</font> x '
        '<font color="#a855f7">可找到</font> x '
        '<font color="#f59e0b">可共鸣</font></font><br/><br/>'
        '<font name="CN-Light" size="10" color="#333333">'
        '= 用户从  <font color="#3b82f6">能用</font>  →  '
        '<font color="#10b981">敢用</font>  →  '
        '<font color="#a855f7">会用</font>  →  '
        '<font color="#f59e0b">想用</font></font>',
        ParagraphStyle('fb', fontName='CN', fontSize=14, leading=22, alignment=TA_CENTER)
    )]]
    fbt = Table(formula_box, colWidths=[W - 20])
    fbt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f8f9fc')),
        ('BOX', (0, 0), (-1, -1), 1.5, C_PRIMARY),
        ('TOPPADDING', (0, 0), (-1, -1), 20),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
        ('LEFTPADDING', (0, 0), (-1, -1), 20),
        ('RIGHTPADDING', (0, 0), (-1, -1), 20),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
    ]))
    story.append(fbt)
    story.append(Spacer(1, 14))

    story.append(Paragraph(
        '前三个维度解决的是<b>功能性问题</b>——用户能否完成任务；'
        '"可共鸣"解决的是<b>复用动机问题</b>——用户不是因为没有替代方案才回来，'
        '而是因为这个过程本身让人觉得舒服。', S['body']))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        '这正好呼应了业务目标中最关键的三个字：<b>"愿复用"</b>。', S['body']))
    story.append(Spacer(1, 12))

    story.append(Paragraph('<b>三线验证的完整闭环</b>', S['h2']))
    story.append(Paragraph(
        '<b>埋点数据</b>告诉我们"发生了什么"——哪些步骤用户完成了，哪些放弃了；<br/>'
        '<b>四维模型</b>帮我们理解"为什么这样设计"——每个设计决策对应的体验维度；<br/>'
        '<b>可用性测试</b>验证"用户实际感受如何"——真实的行为观察和主观反馈。', S['body']))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        '三条线交叉验证，形成<b>定量 + 定性 + 实测</b>的完整证据链，'
        '确保我们对产品体验的判断不是自说自话，而是有据可依。', S['body']))
    story.append(Spacer(1, 20))

    # Closing box
    close_box = [[Paragraph(
        '<font name="CN-Light" size="9" color="#666666">'
        'Tideo AI 产品体验验证框架 v1.0<br/>'
        '2026 年 4 月  ·  Tideo 产品团队'
        '</font>',
        ParagraphStyle('close', fontName='CN-Light', fontSize=9, leading=14, alignment=TA_CENTER)
    )]]
    cbt = Table(close_box, colWidths=[W])
    cbt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_LIGHTBG),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
    ]))
    story.append(cbt)

    # ═══════════════════════════════════════
    # BUILD
    # ═══════════════════════════════════════
    doc.build(story, onFirstPage=page_number, onLaterPages=page_number)
    print(f'\n✅ PDF 已生成: {output_path}')
    print(f'   文件大小: {os.path.getsize(output_path) / 1024:.1f} KB')
    return output_path

if __name__ == '__main__':
    build_pdf()
