import os
import math
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

# Helper to fix Arabic text shaping and direction in PIL images
def format_ar(text):
    if not text:
        return ""
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)

def get_fonts():
    font_path = r"C:\Windows\Fonts\arial.ttf"
    font_bold_path = r"C:\Windows\Fonts\arialbd.ttf"
    try:
        f_lg = ImageFont.truetype(font_bold_path, 22)
        f_md = ImageFont.truetype(font_path, 18)
        f_sm = ImageFont.truetype(font_path, 15)
        f_sm_bold = ImageFont.truetype(font_bold_path, 15)
    except Exception:
        f_lg = f_md = f_sm = f_sm_bold = ImageFont.load_default()
    return f_lg, f_md, f_sm, f_sm_bold

# --- 1. Draw High-Quality Mathematical Diagrams with Perfect Arabic & Math Layout ---

def create_diagram_1(filepath):
    # Diagram 1: Basic Cartesian & Polar Coordinates P(x, y) / P(r, theta)
    w, h = 950, 700
    img = Image.new('RGB', (w, h), color='#ffffff')
    draw = ImageDraw.Draw(img)
    f_lg, f_md, f_sm, f_sm_bold = get_fonts()
    
    ox, oy = 220, 520
    scale = 65
    
    # Light grid
    for i in range(1, 10):
        draw.line([(ox + i*scale, 60), (ox + i*scale, 610)], fill='#f1f5f9', width=1)
        draw.line([(90, oy - i*scale), (870, oy - i*scale)], fill='#f1f5f9', width=1)
    
    # Axes
    draw.line([(100, oy), (860, oy)], fill='#1e293b', width=3) # X-axis
    draw.line([(ox, 610), (ox, 70)], fill='#1e293b', width=3)  # Y-axis
    
    # Arrows
    draw.polygon([(865, oy), (850, oy-7), (850, oy+7)], fill='#1e293b') # +X
    draw.polygon([(ox, 65), (ox-7, 80), (ox+7, 80)], fill='#1e293b')   # +Y
    
    # Point P(x=6, y=4.5)
    px = ox + 6 * scale
    py = oy - int(4.5 * scale)
    
    # Triangle fill
    draw.polygon([(ox, oy), (px, oy), (px, py)], fill='#fee2e2')
    
    # Vertical projection dashed
    for y_dash in range(py, oy, 10):
        draw.line([(px, y_dash), (px, min(y_dash + 6, oy))], fill='#3b82f6', width=2)
    
    # Horizontal projection dashed
    for x_dash in range(ox, px, 10):
        draw.line([(x_dash, py), (min(x_dash + 6, px), py)], fill='#64748b', width=2)
        
    # Vector r
    draw.line([(ox, oy), (px, py)], fill='#e11d48', width=4)
    
    # Angle arc
    draw.arc([ox - 75, oy - 75, ox + 75, oy + 75], start=360-37, end=360, fill='#10b981', width=3)
    
    # Dots
    draw.ellipse([px-7, py-7, px+7, py+7], fill='#e11d48', outline='#ffffff', width=2)
    draw.ellipse([ox-4, oy-4, ox+4, oy+4], fill='#1e293b')
    
    # Labels
    draw.text((865, oy + 10), "x", fill='#1e293b', font=f_lg)
    draw.text((ox - 30, 60), "y", fill='#1e293b', font=f_lg)
    draw.text((ox - 45, oy + 10), "O(0,0)", fill='#64748b', font=f_sm_bold)
    
    draw.text((px + 15, py - 20), "P(x, y) = P(r, θ)", fill='#e11d48', font=f_lg)
    draw.text(((ox+px)//2 - 25, (oy+py)//2 - 35), "r", fill='#e11d48', font=f_lg)
    draw.text(((ox+px)//2 - 30, oy + 12), "x = r cos θ", fill='#3b82f6', font=f_md)
    draw.text((px + 15, (oy+py)//2 - 10), "y = r sin θ", fill='#3b82f6', font=f_md)
    draw.text((ox + 90, oy - 38), "θ", fill='#10b981', font=f_lg)
    
    img.save(filepath, quality=95)

def create_diagram_2(filepath):
    # Diagram 2: Positive Angle (+theta) vs Negative Angle (-theta) exactly like notebook image
    w, h = 950, 520
    img = Image.new('RGB', (w, h), color='#ffffff')
    draw = ImageDraw.Draw(img)
    f_lg, f_md, f_sm, f_sm_bold = get_fonts()
    
    ox, oy = 250, 260
    r_len = 400
    
    # Base X-axis
    draw.line([(100, oy), (830, oy)], fill='#1e293b', width=3)
    draw.polygon([(835, oy), (820, oy-7), (820, oy+7)], fill='#1e293b')
    
    # Angle +30 deg (Counter-Clockwise)
    rad_pos = 30 * math.pi / 180
    p_pos_x = ox + int(r_len * math.cos(rad_pos))
    p_pos_y = oy - int(r_len * math.sin(rad_pos))
    draw.line([(ox, oy), (p_pos_x, p_pos_y)], fill='#e11d48', width=4)
    
    # Angle -30 deg (Clockwise)
    rad_neg = -30 * math.pi / 180
    p_neg_x = ox + int(r_len * math.cos(rad_neg))
    p_neg_y = oy - int(r_len * math.sin(rad_neg))
    draw.line([(ox, oy), (p_neg_x, p_neg_y)], fill='#6366f1', width=4)
    
    # Positive arc + Arrow (pointing Counter-Clockwise: Up)
    draw.arc([ox-110, oy-110, ox+110, oy+110], start=330, end=360, fill='#10b981', width=3)
    draw.polygon([(ox + 95, oy - 55), (ox + 82, oy - 42), (ox + 100, oy - 40)], fill='#10b981')
    
    # Negative arc + Arrow (pointing Clockwise: Down)
    draw.arc([ox-110, oy-110, ox+110, oy+110], start=0, end=30, fill='#f59e0b', width=3)
    draw.polygon([(ox + 95, oy + 55), (ox + 82, oy + 42), (ox + 100, oy + 40)], fill='#f59e0b')
    
    # Origin dot & label
    draw.ellipse([ox-4, oy-4, ox+4, oy+4], fill='#1e293b')
    draw.text((ox - 35, oy - 12), "O", fill='#1e293b', font=f_lg)
    draw.text((840, oy - 12), "x", fill='#1e293b', font=f_lg)
    
    # Text annotations in clean formatted Arabic & English math
    ar_pos_text = format_ar("اتجاه موجب (+) عكس عقارب الساعة")
    ar_neg_text = format_ar("اتجاه سالب (-) مع حركة عقارب الساعة")
    
    draw.text((p_pos_x + 15, p_pos_y - 25), "θ (+)", fill='#e11d48', font=f_lg)
    draw.text((p_pos_x + 85, p_pos_y - 20), f":  {ar_pos_text}", fill='#10b981', font=f_md)
    
    draw.text((p_neg_x + 15, p_neg_y - 5), "θ (-)", fill='#6366f1', font=f_lg)
    draw.text((p_neg_x + 85, p_neg_y), f":  {ar_neg_text}", fill='#f59e0b', font=f_md)
    
    draw.text((ox + 130, oy - 48), "+θ", fill='#10b981', font=f_lg)
    draw.text((ox + 130, oy + 22), "-θ", fill='#f59e0b', font=f_lg)
    
    img.save(filepath, quality=95)

def create_diagram_3(filepath):
    # Diagram 3: Example 1 Points Plotting: (1, 30), (2, 30), (-1, 30), (1, 210), (-1, -150)
    w, h = 950, 750
    img = Image.new('RGB', (w, h), color='#ffffff')
    draw = ImageDraw.Draw(img)
    f_lg, f_md, f_sm, f_sm_bold = get_fonts()
    
    ox, oy = 460, 380
    scale = 135
    
    # Polar Circles r=1, r=2, r=3
    for r_val in [1, 2, 3]:
        r_px = r_val * scale
        draw.ellipse([ox-r_px, oy-r_px, ox+r_px, oy+r_px], outline='#e2e8f0', width=1)
        draw.text((ox + r_px + 5, oy + 4), f"r={r_val}", fill='#94a3b8', font=f_sm)
    
    # Axes
    draw.line([(80, oy), (850, oy)], fill='#1e293b', width=2)
    draw.line([(ox, 710), (ox, 50)], fill='#1e293b', width=2)
    
    # Line passing through 30 deg and 210 deg
    rad30 = 30 * math.pi / 180
    x_ray_pos = ox + int(3.1 * scale * math.cos(rad30))
    y_ray_pos = oy - int(3.1 * scale * math.sin(rad30))
    x_ray_neg = ox - int(3.1 * scale * math.cos(rad30))
    y_ray_neg = oy + int(3.1 * scale * math.sin(rad30))
    
    # Positive ray 30 deg
    draw.line([(ox, oy), (x_ray_pos, y_ray_pos)], fill='#0284c7', width=3)
    # Negative extension (210 deg)
    draw.line([(ox, oy), (x_ray_neg, y_ray_neg)], fill='#f59e0b', width=3)
    
    # Points
    # P1 (1, 30)
    p1_x = ox + int(1 * scale * math.cos(rad30))
    p1_y = oy - int(1 * scale * math.sin(rad30))
    draw.ellipse([p1_x-7, p1_y-7, p1_x+7, p1_y+7], fill='#0284c7', outline='#ffffff', width=2)
    
    # P2 (2, 30)
    p2_x = ox + int(2 * scale * math.cos(rad30))
    p2_y = oy - int(2 * scale * math.sin(rad30))
    draw.ellipse([p2_x-7, p2_y-7, p2_x+7, p2_y+7], fill='#10b981', outline='#ffffff', width=2)
    
    # Equivalent point: (-1, 30) / (1, 210) / (-1, -150)
    p_equiv_x = ox - int(1 * scale * math.cos(rad30))
    p_equiv_y = oy + int(1 * scale * math.sin(rad30))
    draw.ellipse([p_equiv_x-9, p_equiv_y-9, p_equiv_x+9, p_equiv_y+9], fill='#e11d48', outline='#ffffff', width=2)
    
    # Arc 30 deg
    draw.arc([ox-60, oy-60, ox+60, oy+60], start=330, end=360, fill='#0284c7', width=2)
    # Arc 210 deg
    draw.arc([ox-90, oy-90, ox+90, oy+90], start=150, end=360, fill='#ec4899', width=2)
    
    draw.text((p1_x + 10, p1_y - 25), "(1, 30°)", fill='#0284c7', font=f_md)
    draw.text((p2_x + 10, p2_y - 25), "(2, 30°)", fill='#059669', font=f_md)
    
    # Equivalent Point Multi-Label
    equiv_label_ar = format_ar("نقطة متطابقة في الربع الثالث:")
    draw.text((p_equiv_x - 240, p_equiv_y + 10), equiv_label_ar, fill='#e11d48', font=f_sm_bold)
    draw.text((p_equiv_x - 240, p_equiv_y + 35), "(-1, 30°) = (1, 210°) = (-1, -150°)", fill='#e11d48', font=f_md)
    
    draw.text((ox + 70, oy - 25), "30° (π/6)", fill='#0284c7', font=f_sm_bold)
    draw.text((ox - 110, oy - 65), "210° (7π/6)", fill='#ec4899', font=f_sm_bold)
    draw.text((ox + 15, oy + 15), "O", fill='#1e293b', font=f_lg)
    draw.text((855, oy - 15), "x", fill='#1e293b', font=f_lg)
    draw.text((ox + 10, 50), "y", fill='#1e293b', font=f_lg)
    
    img.save(filepath, quality=95)

# --- 2. Generate Word Document (.docx) ---
def build_word_doc(docx_path, img1, img2, img3):
    doc = docx.Document()
    
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    def set_p_rtl(p):
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        pPr = p._p.get_or_add_pPr()
        pPr.append(parse_xml(r'<w:bidi xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>'))

    # Title
    p_title = doc.add_paragraph()
    set_p_rtl(p_title)
    r_title = p_title.add_run("الإحداثيات الديكارتية والقطبية (Cartesian & Polar Coordinates)")
    r_title.bold = True
    r_title.font.size = Pt(22)
    r_title.font.color.rgb = RGBColor(15, 23, 42)
    r_title.font.name = "Arial"
    
    p_sub = doc.add_paragraph()
    set_p_rtl(p_sub)
    r_sub = p_sub.add_run("شرح شامل ومفصل للقوانين، الاتجاه، تعيين النقاط، والمثال المحلول (Ex 1)")
    r_sub.font.size = Pt(13)
    r_sub.font.color.rgb = RGBColor(100, 116, 139)
    r_sub.font.name = "Arial"
    
    doc.add_paragraph()

    # Section 1
    h1 = doc.add_paragraph()
    set_p_rtl(h1)
    r1 = h1.add_run("1. المفاهيم الأساسية وقوانين التحويل")
    r1.bold = True
    r1.font.size = Pt(16)
    r1.font.color.rgb = RGBColor(2, 132, 199)

    p1 = doc.add_paragraph()
    set_p_rtl(p1)
    p1.add_run("• الإحداثيات الديكارتية (Cartesian Coordinates): تُحدد موقع النقطة بدلالة المسافات الأفقية والعمودية P(x, y).\n"
               "• الإحداثيات القطبية (Polar Coordinates): تُحدد موقع النقطة بدلالة المسافة المتجهة من القطب (نصف القطر r) والزاوية الموجهة P(r, θ).")

    # Table
    table = doc.add_table(rows=3, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = "التحويل من قطبي إلى ديكارتي (Polar → Cartesian)"
    hdr_cells[1].text = "التحويل من ديكارتي إلى قطبي (Cartesian → Polar)"
    for cell in hdr_cells:
        cell.paragraphs[0].runs[0].font.bold = True
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_p_rtl(cell.paragraphs[0])
        shading_elm = parse_xml(r'<w:shd xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:fill="0284C7"/>')
        cell._tc.get_or_add_tcPr().append(shading_elm)

    row1_cells = table.rows[1].cells
    row1_cells[0].text = "x = r cos(θ)"
    row1_cells[1].text = "r = √(x² + y²)"
    set_p_rtl(row1_cells[0].paragraphs[0])
    set_p_rtl(row1_cells[1].paragraphs[0])

    row2_cells = table.rows[2].cells
    row2_cells[0].text = "y = r sin(θ)"
    row2_cells[1].text = "θ = tan⁻¹(y / x)"
    set_p_rtl(row2_cells[0].paragraphs[0])
    set_p_rtl(row2_cells[1].paragraphs[0])
    
    doc.add_paragraph()

    # Picture 1
    p_img1 = doc.add_paragraph()
    p_img1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_picture(img1, width=Inches(5.5))
    
    p_cap1 = doc.add_paragraph()
    p_cap1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_p_rtl(p_cap1)
    r_cap1 = p_cap1.add_run("الشكل 1: مثلث التحويل الهندسي بين الإحداثيات الديكارتية والقطبية")
    r_cap1.font.size = Pt(10)
    r_cap1.font.italic = True
    r_cap1.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_page_break()

    # Section 2
    h2 = doc.add_paragraph()
    set_p_rtl(h2)
    r2 = h2.add_run("2. اتجاه قياس الزاوية القطبية (Angle Direction)")
    r2.bold = True
    r2.font.size = Pt(16)
    r2.font.color.rgb = RGBColor(2, 132, 199)

    p2 = doc.add_paragraph()
    set_p_rtl(p2)
    p2.add_run("• الزاوية الموجبة (+θ): تُقاس بالدوران بعكس اتجاه عقارب الساعة بدءاً من الاتجاه الموجب لمحور السينات (القطب الأولي).\n"
               "• الزاوية السالبة (-θ): تُقاس بالدوران مع اتجاه حركة عقارب الساعة بدءاً من الاتجاه الموجب لمحور السينات.")

    p_img2 = doc.add_paragraph()
    p_img2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_picture(img2, width=Inches(5.5))

    p_cap2 = doc.add_paragraph()
    p_cap2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_p_rtl(p_cap2)
    r_cap2 = p_cap2.add_run("الشكل 2: توضيح الفرق بين اتجاه الزاوية الموجبة (+) والزاوية السالبة (-)")
    r_cap2.font.size = Pt(10)
    r_cap2.font.italic = True
    r_cap2.font.color.rgb = RGBColor(100, 116, 139)

    # Section 3
    h3 = doc.add_paragraph()
    set_p_rtl(h3)
    r3 = h3.add_run("3. حل وشرح المثال الأول بالتفصيل (Example 1)")
    r3.bold = True
    r3.font.size = Pt(16)
    r3.font.color.rgb = RGBColor(2, 132, 199)

    p_ex_title = doc.add_paragraph()
    set_p_rtl(p_ex_title)
    r_ex = p_ex_title.add_run("المسألة: عيّن النقاط التالية في المستوى القطبي:\n"
                              "P₁(1, 30°),  P₂(2, 30°),  P₃(-1, 30°),  P₄(1, 210°),  P₅(-1, -150°)")
    r_ex.bold = True

    p_ex_sol = doc.add_paragraph()
    set_p_rtl(p_ex_sol)
    p_ex_sol.add_run(
        "الشرح والخطوات الرياضية:\n"
        "1. النقطة P₁(1, 30°): زاوية 30° (π/6) على بعد وحدة واحدة في الربع الأول.\n"
        "2. النقطة P₂(2, 30°): على نفس شعاع الزاوية 30° ولكن على مسافة وحدتين.\n"
        "3. النقطة P₃(-1, 30°): بما أن r سالب (-1)، نقف عند زاوية 30° ثم نتحرك في الاتجاه المعاكس تماماً (نضيف 180°)، فتصل النقطة إلى (1, 210°) في الربع الثالث.\n"
        "4. النقطة P₄(1, 210°): زاوية 210° موجبة مع r = 1، وتقع في الربع الثالث.\n"
        "5. النقطة P₅(-1, -150°): الزاوية -150° تدور مع عقارب الساعة لتصل لنفس شعاع 210°، ومع r سالب نتحرك عكسها فتستقر في الربع الثالث.\n\n"
        "💡 النتيجة الهامة: النقاط (-1, 30°) و (1, 210°) و (-1, -150°) تمثل جميعاً نفس النقطة الهندسية في المستوى!"
    )

    p_img3 = doc.add_paragraph()
    p_img3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_picture(img3, width=Inches(5.5))

    p_cap3 = doc.add_paragraph()
    p_cap3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_p_rtl(p_cap3)
    r_cap3 = p_cap3.add_run("الشكل 3: تمثيل نقاط المثال الأول وبيان تطابق النقاط P₃, P₄, P₅")
    r_cap3.font.size = Pt(10)
    r_cap3.font.italic = True
    r_cap3.font.color.rgb = RGBColor(100, 116, 139)

    doc.save(docx_path)

# --- 3. Generate PDF Document (.pdf) ---
def build_pdf_doc(pdf_path, img1, img2, img3):
    pdf = SimpleDocTemplate(pdf_path, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    story = []
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        alignment=1
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#64748b'),
        alignment=1
    )
    
    h1_style = ParagraphStyle(
        'DocH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0284c7'),
        spaceBefore=12,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1e293b')
    )
    
    caption_style = ParagraphStyle(
        'DocCaption',
        parent=styles['Italic'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#64748b'),
        alignment=1
    )

    story.append(Paragraph("Cartesian & Polar Coordinates Visualizer & Guide", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Comprehensive Mathematical Guide with Visual Sketches & Solved Example 1", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0'), spaceBefore=5, spaceAfter=15))

    # Section 1
    story.append(Paragraph("1. Fundamental Equations & Conversion Rules", h1_style))
    story.append(Paragraph("<b>Cartesian Coordinates:</b> Represented by (x, y) coordinates on perpendicular axes.<br/>"
                           "<b>Polar Coordinates:</b> Represented by distance from origin (r) and directed angle (θ) as (r, θ).", body_style))
    story.append(Spacer(1, 8))

    table_data = [
        [Paragraph("<b>Polar → Cartesian</b>", body_style), Paragraph("<b>Cartesian → Polar</b>", body_style)],
        ["x = r · cos(θ)", "r = √(x² + y²)"],
        ["y = r · sin(θ)", "θ = arctan(y / x)"]
    ]
    t = Table(table_data, colWidths=[240, 240])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0284c7')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    story.append(RLImage(img1, width=5.2*inch, height=3.8*inch))
    story.append(Paragraph("Figure 1: Geometric Relationship & Right-Triangle Projections for P(x,y) and P(r, θ)", caption_style))
    story.append(Spacer(1, 15))

    # Section 2
    story.append(Paragraph("2. Direction of Angles: Positive (+) vs Negative (-)", h1_style))
    story.append(Paragraph("• <b>Positive Angle (+θ):</b> Measured counter-clockwise from positive x-axis.<br/>"
                           "• <b>Negative Angle (-θ):</b> Measured clockwise from positive x-axis.", body_style))
    story.append(Spacer(1, 8))
    story.append(RLImage(img2, width=5.2*inch, height=2.8*inch))
    story.append(Paragraph("Figure 2: Positive angle direction (+) vs Negative angle direction (-)", caption_style))
    story.append(Spacer(1, 15))

    # Section 3
    story.append(Paragraph("3. Example 1: Sketching Points & Negative Radius Equivalence", h1_style))
    story.append(Paragraph("<b>Problem:</b> Plot points (1, 30°), (2, 30°), (-1, 30°), (1, 210°), (-1, -150°).<br/>"
                           "<b>Key Concept:</b> When r &lt; 0, travel in the opposite direction along the ray (add/subtract 180°).<br/>"
                           "Therefore: <b>(-1, 30°) ≡ (1, 210°) ≡ (-1, -150°)</b> — all land on the exact same location in Quadrant III.", body_style))
    story.append(Spacer(1, 8))
    story.append(RLImage(img3, width=5.2*inch, height=4.1*inch))
    story.append(Paragraph("Figure 3: Graphical verification of Ex 1 points and equivalence in Quadrant III", caption_style))

    pdf.build(story)

def main():
    out_dir = r"e:\مناهج\رسومات مهمة"
    img1 = os.path.join(out_dir, "diagram1_cartesian_polar.png")
    img2 = os.path.join(out_dir, "diagram2_angles_direction.png")
    img3 = os.path.join(out_dir, "diagram3_example1_points.png")
    
    create_diagram_1(img1)
    create_diagram_2(img2)
    create_diagram_3(img3)
    
    docx_file = os.path.join(out_dir, "الاحداثيات_القطبية_والديكارتية.docx")
    pdf_file = os.path.join(out_dir, "الاحداثيات_القطبية_والديكارتية.pdf")
    
    build_word_doc(docx_file, img1, img2, img3)
    build_pdf_doc(pdf_file, img1, img2, img3)
    
    print("ALL_DOCS_AND_DIAGRAMS_REGENERATED_SUCCESSFULLY")

if __name__ == '__main__':
    main()
