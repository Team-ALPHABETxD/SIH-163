from datetime import datetime
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet

def build_pdf(report, findings, chains=None):
    buf=BytesIO(); doc=SimpleDocTemplate(buf,pagesize=A4,rightMargin=36,leftMargin=36,topMargin=36,bottomMargin=36)
    styles=getSampleStyleSheet(); story=[Paragraph(report.title,styles['Title']),Paragraph(f"Target: {report.target_name} — {report.target_url}",styles['Normal']),Spacer(1,12),Paragraph('Executive Summary',styles['Heading2']),Paragraph(report.executive_summary,styles['BodyText']),Spacer(1,12),Paragraph('Findings',styles['Heading2'])]
    rows=[['Severity','Title','CVSS','CWE']]+[[f.severity.upper(),f.title,str(f.cvss_score),f.cwe] for f in findings]
    t=Table(rows,colWidths=[65,260,45,70]); t.setStyle(TableStyle([('GRID',(0,0),(-1,-1),0.25,colors.grey),('BACKGROUND',(0,0),(-1,0),colors.lightgrey),('VALIGN',(0,0),(-1,-1),'TOP')]))
    story += [t,Spacer(1,12),Paragraph('Methodology',styles['Heading2']),Paragraph(report.methodology,styles['BodyText'])]
    chains = chains or []
    story += [Spacer(1,12), Paragraph('Attack Chains', styles['Heading2'])]
    if chains:
        for c in chains:
            story += [Paragraph(f'{c.title} — {c.severity.upper()} (score {c.score})', styles['BodyText']), Paragraph(c.description, styles['BodyText']), Spacer(1,6)]
    else:
        story += [Paragraph('No candidate attack chains were generated for this assessment.', styles['BodyText'])]
    doc.build(story); buf.seek(0); return buf

def build_markdown(report, findings, chains):
    out=[f'# {report.title}',f'**Target:** {report.target_name} ({report.target_url})',f'**Date:** {report.assessment_date}','', '## Executive Summary',report.executive_summary,'','## Findings']
    for f in findings:
        out += [f'### {f.severity.upper()} — {f.title}',f'- CVSS: {f.cvss_score} ({f.cwe})',f'- Component: {f.affected_component}',f'- {f.description}' if f.description else '',f'- Remediation: {f.remediation.get("summary","")}' if isinstance(f.remediation,dict) else '', '']
    out += ['## Attack Chains']
    for c in chains: out += [f'- **{c.title}** ({c.severity}, {c.score}) — {c.description}']
    return '\n'.join(out)
