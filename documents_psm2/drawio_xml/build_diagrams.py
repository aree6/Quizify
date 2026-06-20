#!/usr/bin/env python3
"""
Extract cells from the user's PSM1 Draw.io file and produce updated
PSM2 .drawio files that match the user's style.

For each output file:
  - Read the relevant page from MOHAMMAD_AREEB_PSM1.drawio.xml
  - Filter cells to only the ones that belong to that diagram
  - Apply text/label replacements for PSM2
  - Wrap in a minimal .drawio XML skeleton
  - Write to the output path
"""
import re
import os
from pathlib import Path

SOURCE_XML = '/Users/Areeb/Quizify/MOHAMMAD_AREEB_PSM1.drawio.xml'
OUTPUT_DIR = Path('/Users/Areeb/Quizify/documents_psm2/drawio_xml')

# Common style attributes from the user's file
STYLE_USER = (
    'fontSize=16;fontFamily=Tahoma'
)
STYLE_SWIMLANE = (
    'swimlane;startSize=40;fillColor=#f5f5f5;strokeColor=#666666;'
    'fontStyle=1;fontSize=16;fontColor=#333333;fontFamily=Tahoma;'
)
STYLE_ACTIVITY = (
    'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;'
    'strokeColor=#000000;arcSize=20;fontSize=16;fontFamily=Tahoma;'
)
STYLE_DECISION = (
    'rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFFF;'
    'strokeColor=#000000;fontSize=16;fontFamily=Tahoma;'
)
STYLE_EDGE = (
    'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;'
    'jettySize=auto;html=1;strokeColor=#000000;endArrow=classic;'
    'fontSize=16;fontFamily=Tahoma;'
)
STYLE_EDGE_DASHED = (
    'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;'
    'jettySize=auto;html=1;strokeColor=#000000;endArrow=classic;'
    'dashed=1;fontSize=16;fontFamily=Tahoma;'
)
STYLE_ACTOR = (
    'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;'
    'html=1;strokeColor=#000000;fillColor=#ffffff;'
    'fontSize=16;fontFamily=Tahoma;'
)
STYLE_LIFELINE = (
    'shape=umlLifeline;participant=umlActor;'
    'portConstraint=eastwest;whiteSpace=wrap;html=1;'
    'fillColor=#FFFFFF;strokeColor=#000000;'
    'fontSize=16;fontFamily=Tahoma;'
)
STYLE_ACTIVATION = (
    'rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;'
    'strokeColor=#000000;fontSize=16;fontFamily=Tahoma;'
)
STYLE_ELLIPSE = (
    'ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;'
    'strokeColor=#000000;'
)
STYLE_BOUNDARY = (
    'rounded=1;whiteSpace=wrap;html=1;strokeWidth=1;'
    'fontSize=16;fillColor=#ffffff;strokeColor=#000000;'
)
STYLE_TITLE = (
    'text;html=1;align=center;verticalAlign=middle;'
    'fontSize=18;fontStyle=1;fontFamily=Tahoma;'
)
STYLE_NOTE = (
    'shape=note;whiteSpace=wrap;html=1;align=left;'
    'verticalAlign=top;strokeColor=#000000;'
    'fillColor=#fff2cc;fontSize=14;fontFamily=Tahoma;'
)
STYLE_PROCESS = (
    'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;'
    'strokeColor=#000000;arcSize=20;fontSize=14;'
    'fontFamily=Tahoma;'
)


def parse_source():
    with open(SOURCE_XML) as f:
        return f.read()


def xe(s):
    """Escape a string for safe use as an XML attribute value."""
    if s is None:
        return ''
    return (str(s)
             .replace('&', '&amp;')
             .replace('<', '&lt;')
             .replace('>', '&gt;')
             .replace('"', '&quot;')
             .replace("'", '&apos;')
             .replace('\n', '&#xa;')
             .replace('\r', ''))


def extract_page_body(content, page_name):
    pattern = re.compile(
        rf'<diagram [^>]*name="{re.escape(page_name)}"[^>]*>(.*?)</diagram>',
        re.DOTALL
    )
    m = pattern.search(content)
    return m.group(1) if m else None


def extract_all_cells(page_body):
    """Extract complete <mxCell> elements (both self-closing and multi-line).
    Uses a balanced-tag approach so it correctly handles cells that contain
    self-closing inner elements like <mxPoint .../>.

    Skips the standard root cells (id="0" and id="1") because wrap_in_drawio
    will add fresh ones - otherwise Draw.io sees duplicate ids and renders
    nothing for the page.
    """
    cells = []
    i = 0
    n = len(page_body)
    while i < n:
        idx = page_body.find('<mxCell', i)
        if idx == -1:
            break
        end_open = page_body.find('>', idx)
        if end_open == -1:
            break
        if page_body[end_open - 1] == '/':
            cell_xml = page_body[idx:end_open + 1]
            if not _is_root_cell(cell_xml):
                cells.append(cell_xml)
            i = end_open + 1
            continue
        # multi-line: balance tags
        depth = 1
        j = end_open + 1
        while j < n and depth > 0:
            nopen = page_body.find('<mxCell', j)
            nclose = page_body.find('</mxCell>', j)
            if nclose == -1:
                break
            if nopen != -1 and nopen < nclose:
                no_end = page_body.find('>', nopen)
                if no_end != -1 and page_body[no_end - 1] == '/':
                    j = no_end + 1
                    continue
                depth += 1
                j = no_end + 1
            else:
                depth -= 1
                if depth == 0:
                    cell_xml = page_body[idx:nclose + len('</mxCell>')]
                    if not _is_root_cell(cell_xml):
                        cells.append(cell_xml)
                    j = nclose + len('</mxCell>')
                    break
                j = nclose + len('</mxCell>')
        i = j
    return cells


def _is_root_cell(cell_xml):
    """Return True if this is a standard root cell (id="0" or id="1")."""
    m = re.search(r'<mxCell[^>]*\sid="([01])"', cell_xml)
    return m is not None


def c(id_, value, style, x, y, w, h, parent='1', vertex='1'):
    """Build a multi-line <mxCell> in the same style as the source file.
    Matches the format used in the user's per-UC working files."""
    value_attr = f' value="{xe(value)}"' if value else ' value=""'
    return (
        f'<mxCell id="{xe(id_)}"{value_attr} style="{style}" '
        f'vertex="{vertex}" parent="{xe(parent)}">\n'
        f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" '
        f'as="geometry" />\n'
        f'        </mxCell>'
    )


def c_edge(id_, value, style, source, target, parent='1'):
    """Build a multi-line <mxCell> edge in the same style as the source."""
    value_attr = f' value="{xe(value)}"' if value else ' value=""'
    return (
        f'<mxCell id="{xe(id_)}" edge="1"{value_attr} style="{style}" '
        f'parent="{xe(parent)}" source="{xe(source)}" target="{xe(target)}">\n'
        f'          <mxGeometry relative="1" as="geometry" />\n'
        f'        </mxCell>'
    )


def extract_cells_by_prefix(page_body, prefix):
    cells = extract_all_cells(page_body)
    result = []
    for cell in cells:
        id_match = re.search(r'id="([^"]+)"', cell)
        if id_match and id_match.group(1).startswith(prefix):
            result.append(cell)
    return result


def apply_text_replacements(cells, replacements):
    """Replace text in `value="..."` attributes, properly escaping the
    replacement so the resulting XML stays well-formed."""
    result = []
    for cell in cells:
        for old, new in replacements.items():
            escaped_old = (
                old.replace('&', '&amp;')
                   .replace('<', '&lt;')
                   .replace('>', '&gt;')
                   .replace('"', '&quot;')
                   .replace("'", '&apos;')
            )
            escaped_new = (
                new.replace('&', '&amp;')
                   .replace('<', '&lt;')
                   .replace('>', '&gt;')
                   .replace('"', '&quot;')
                   .replace("'", '&apos;')
            )
            cell = cell.replace(f'value="{escaped_old}"', f'value="{escaped_new}"')
        result.append(cell)
    return result


def wrap_in_drawio(diagram_name, cells_xml, page_width=1169, page_height=827):
    safe_name = re.sub(r'[^a-z0-9_-]', '', diagram_name.lower().replace(' ', '-'))
    diagram_id = f'diagram-{safe_name}'
    cells_block = '\n        '.join(cells_xml) if cells_xml else ''
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<mxfile host="app.diagrams.net" '
        'modified="2026-06-20T00:00:00.000Z" '
        'agent="Mozilla/5.0" version="22.1.0">\n'
        f'  <diagram name="{xe(diagram_name)}" id="{xe(diagram_id)}">\n'
        '    <mxGraphModel dx="1400" dy="800" grid="1" gridSize="10" '
        'guides="1" tooltips="1" connect="1" arrows="1" fold="1" '
        'page="1" pageScale="1" '
        f'pageWidth="{page_width}" pageHeight="{page_height}" '
        'math="0" shadow="0">\n'
        '      <root>\n'
        '        <mxCell id="0"/>\n'
        '        <mxCell id="1" parent="0"/>\n'
        f'        {cells_block}\n'
        '      </root>\n'
        '    </mxGraphModel>\n'
        '  </diagram>\n'
        '</mxfile>\n'
    )


def write_file(rel_path, content):
    full_path = OUTPUT_DIR / rel_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    with open(full_path, 'w') as f:
        f.write(content)
    print(f"Wrote {rel_path}")


# ---------------------------------------------------------------------------
# Per-UC diagrams: extract by ID prefix, do text replacements
# ---------------------------------------------------------------------------

def process_per_uc(content, page_name, prefix, diagram_name, output_rel,
                   replacements, page_width=1169, page_height=827):
    page_body = extract_page_body(content, page_name)
    if not page_body:
        print(f"WARNING: page {page_name} not found")
        return
    cells = extract_cells_by_prefix(page_body, prefix)
    cells = apply_text_replacements(cells, replacements)
    xml = wrap_in_drawio(diagram_name, cells, page_width, page_height)
    write_file(output_rel, xml)


# ---------------------------------------------------------------------------
# Top-level diagrams: extract all cells from a single page
# ---------------------------------------------------------------------------

def process_top_level(content, page_name, diagram_name, output_rel,
                      replacements, page_width=1169, page_height=827,
                      filter_keep=None, filter_remove=None):
    page_body = extract_page_body(content, page_name)
    if not page_body:
        print(f"WARNING: page {page_name} not found")
        return
    cells = extract_all_cells(page_body)
    if filter_keep:
        cells = [
            c for c in cells
            if any(re.search(p, c) for p in filter_keep)
        ]
    if filter_remove:
        cells = [
            c for c in cells
            if not any(re.search(p, c) for p in filter_remove)
        ]
    cells = apply_text_replacements(cells, replacements)
    xml = wrap_in_drawio(diagram_name, cells, page_width, page_height)
    write_file(output_rel, xml)


# ---------------------------------------------------------------------------
# US001 - Login (Google OAuth)
# ---------------------------------------------------------------------------

def build_us001(content):
    # US001 activity: email+password -> Google OAuth
    act_repl = {
        'Enter email and password': 'Click "Sign in with Google"',
        'Click Login': 'Authorize with Google',
        'Validate credentials': 'Read user role',
        'Credentials valid?': 'Authorized?',
        'Create session and redirect to dashboard': 'Redirect to role-based dashboard',
        'Display error message': 'Show error: unauthorized account',
    }
    process_per_uc(content, 'US001', 'hTBqnQ9N48vEvmEo0kCT',
                   'US001 - Activity Diagram (Login)',
                   '02_per_uc/US001/US001_activity.drawio',
                   act_repl)

    # US001 sequence: Auth API/User Store -> Supabase Auth
    seq_repl = {
        'Auth API': 'Supabase Auth',
        'User Store': 'Supabase Auth',
        'Lecturer/Admin': 'User',
        'POST /login (email, password)': 'Initiate Google OAuth',
        'Find user by email': 'Read role from auth.users',
        'User record / not found': 'JWT session',
        'Verify password': 'JWT session',
        '200 OK + session/token': 'Return JWT session',
        '401 Unauthorized': 'Show error: unauthorized account',
        'Show error message': 'Show error: unauthorized account',
    }
    process_per_uc(content, 'US001', 'FvFP2Eza3YPkXrhQUCGH',
                   'US001 - Sequence Diagram (Login)',
                   '02_per_uc/US001/US001_sequence.drawio',
                   seq_repl)

    # US001 state machine - need structural changes
    # Old: Unauthenticated -> Login submitted -> Authenticating -> Authenticated
    #      OR -> Login Failed -> Unauthenticated (Retry)
    # New: Idle -> OAuthPending -> Authenticated
    #      OR -> AuthFailed -> Idle (Retry)
    #      Authenticated -> Idle (Sign out)
    write_file(
        '02_per_uc/US001/US001_state.drawio',
        wrap_in_drawio(
            'US001 - State Machine (Login)',
            [
                # Title
                f'<mxCell id="title" value="State Machine: UC001 - Login &amp; Authentication (Google OAuth)" '
                f'style="{STYLE_TITLE}" vertex="1" parent="1">'
                f'<mxGeometry x="200" y="30" width="700" height="30" as="geometry"/></mxCell>',
                # Initial black dot
                f'<mxCell id="initial" value="" style="ellipse;html=1;fillColor=#000000;strokeColor=#000000;" '
                f'vertex="1" parent="1">'
                f'<mxGeometry x="60" y="180" width="20" height="20" as="geometry"/></mxCell>',
                # Idle state
                f'<mxCell id="idle" value="Idle" style="{STYLE_PROCESS}" vertex="1" parent="1">'
                f'<mxGeometry x="140" y="160" width="120" height="60" as="geometry"/></mxCell>',
                # OAuthPending state
                f'<mxCell id="pending" value="OAuthPending" style="{STYLE_PROCESS}" vertex="1" parent="1">'
                f'<mxGeometry x="380" y="160" width="160" height="60" as="geometry"/></mxCell>',
                # Authenticated state (terminal)
                f'<mxCell id="auth" value="Authenticated" style="{STYLE_PROCESS}" vertex="1" parent="1">'
                f'<mxGeometry x="660" y="100" width="180" height="60" as="geometry"/></mxCell>',
                # AuthFailed state
                f'<mxCell id="failed" value="AuthFailed" style="{STYLE_PROCESS}" vertex="1" parent="1">'
                f'<mxGeometry x="660" y="240" width="180" height="60" as="geometry"/></mxCell>',
                # Terminal bull's-eye
                f'<mxCell id="final" value="" style="ellipse;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;" '
                f'vertex="1" parent="1">'
                f'<mxGeometry x="900" y="112" width="26" height="26" as="geometry"/></mxCell>',
                f'<mxCell id="finalInner" value="" style="ellipse;html=1;fillColor=#000000;strokeColor=#000000;" '
                f'vertex="1" parent="1">'
                f'<mxGeometry x="906" y="118" width="14" height="14" as="geometry"/></mxCell>',
                # Transitions
                f'<mxCell id="t1" value="" style="{STYLE_EDGE}" edge="1" parent="1" '
                f'source="initial" target="idle">'
                f'<mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="t2" value="Click Sign in with Google" style="{STYLE_EDGE}" edge="1" parent="1" '
                f'source="idle" target="pending">'
                f'<mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="t3" value="User authorizes with Google" style="{STYLE_EDGE}" edge="1" parent="1" '
                f'source="pending" target="auth">'
                f'<mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="t4" value="User denies" style="{STYLE_EDGE_DASHED}" edge="1" parent="1" '
                f'source="pending" target="failed">'
                f'<mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="t5" value="Retry" style="{STYLE_EDGE_DASHED}" edge="1" parent="1" '
                f'source="failed" target="idle">'
                f'<mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="t6" value="" style="{STYLE_EDGE}" edge="1" parent="1" '
                f'source="auth" target="final">'
                f'<mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="t7" value="Sign out" style="{STYLE_EDGE_DASHED}" edge="1" parent="1" '
                f'source="auth" target="idle">'
                f'<mxGeometry relative="1" as="geometry"/></mxCell>',
                # Note
                f'<mxCell id="note" value="Supabase Auth (Google OAuth). No app-side user table;&#xa;'
                f'role is read from auth.users.app_metadata.role." style="{STYLE_NOTE}" '
                f'vertex="1" parent="1">'
                f'<mxGeometry x="380" y="340" width="460" height="50" as="geometry"/></mxCell>',
            ]
        )
    )


# ---------------------------------------------------------------------------
# US002 - Extract Learning Outcomes (sequence only)
# ---------------------------------------------------------------------------

def build_us002(content):
    # In US002, the activity and sequence share the same prefix
    # (t8_QiU6RuQ1PiE6QdoqK). The state is on a different prefix.
    # The replacements below apply to both activity and sequence,
    # but the activity cells don't contain the text being replaced
    # (e.g., "RAG Service" is only in the sequence lanes), so it's safe.
    repl = {
        'RAG Service': 'Supabase',
        'Database': 'Supabase',
        'Start RAG pipeline': 'match_material_chunks(course_code)',
        'Load course materials metadata': 'SELECT chunks WHERE course_code = $1',
        'Extract learning outcomes + relevant content': 'match_material_chunks returns top-k chunks',
        'Extracted context': 'Relevant context',
    }
    # Combined activity + sequence file (share prefix)
    process_per_uc(content, 'US002', 't8_QiU6RuQ1PiE6QdoqK',
                   'US002 - Activity + Sequence (Extract)',
                   '02_per_uc/US002/US002_activity_and_sequence.drawio',
                   repl)
    # State file (separate prefix)
    process_per_uc(content, 'US002', 'kmrL4DUcZzDR0eLYHlnu',
                   'US002 - State Machine (Extract)',
                   '02_per_uc/US002/US002_state.drawio',
                   {})


# ---------------------------------------------------------------------------
# US004 - Create Quizzes (sequence only)
# ---------------------------------------------------------------------------

def build_us004(content):
    # In US004, the activity and sequence share the same prefix
    # (vokJg7HpGPeSaTTnsTay).
    repl = {
        'RAG Service': 'Backend API',
        'Database': 'Supabase',
        'Generate MCQ quiz set (questions + options)': 'Generate MCQ with Bloom/SOLO metadata + per-option explanations',
        'Quiz questions': 'Questions with option_a..d, explanations, metadata',
        'Save QuizQuestion + QuizOption': 'INSERT INTO questions (option_a..d, explanations, metadata)',
        'Quiz saved': 'Questions saved',
    }
    # Combined activity + sequence file (share prefix)
    process_per_uc(content, 'US004', 'vokJg7HpGPeSaTTnsTay',
                    'US004 - Activity + Sequence (Create Quizzes)',
                    '02_per_uc/US004/US004_activity_and_sequence.drawio',
                    repl)
    # State file (separate prefix)
    process_per_uc(content, 'US004', '7RZ_7jwqV0-FieZ22xGC',
                   'US004 - State Machine (Create Quizzes)',
                   '02_per_uc/US004/US004_state.drawio',
                   {})


# ---------------------------------------------------------------------------
# US005 - View Analytics (activity + sequence)
# ---------------------------------------------------------------------------

def build_us005(content):
    # Activity: flat table -> rich dashboard
    # Activity prefix: l44Lz8qBxJvDF45rMrCk
    act_repl = {
        'Display results table': 'Display analytics dashboard',
        'Display \'No submissions yet\'': 'Display "No submissions yet"',
    }
    process_per_uc(content, 'US005', 'l44Lz8qBxJvDF45rMrCk',
                   'US005 - Activity Diagram (View Analytics)',
                   '02_per_uc/US005/US005_activity.drawio',
                   act_repl)

    # Sequence: flat submissions -> CourseAnalytics
    # Sequence prefix: 7J1mdU0mRvrNOPTbfz2r
    seq_repl = {
        'Analytics API': 'Backend API',
        'Database': 'Supabase',
        'Fetch submissions + scores': 'Aggregate attempts + question metadata',
        'Submission list': 'Aggregated rows',
        'Results table data': 'CourseAnalytics (KPIs, score distribution, topic / Bloom / SOLO, cross-matrix, attempts)',
        'Display results table': 'Render dashboard',
    }
    process_per_uc(content, 'US005', '7J1mdU0mRvrNOPTbfz2r',
                   'US005 - Sequence Diagram (View Analytics)',
                   '02_per_uc/US005/US005_sequence.drawio',
                   seq_repl,
                   page_width=1400, page_height=900)


# ---------------------------------------------------------------------------
# US007 - Update Materials (activity + sequence)
# ---------------------------------------------------------------------------

def build_us007(content):
    # Activity: PDF only -> PDF+PPTX, add processing step
    # Activity prefix: 6jDys-sbq3-s8nwrOBOR
    act_repl = {
        'Select lecture slides (PDF)': 'Select lecture slides (PDF or PPTX)',
        'Upload slides to storage': 'Upload slides to storage',
    }
    process_per_uc(content, 'US007', '6jDys-sbq3-s8nwrOBOR',
                   'US007 - Activity Diagram (Update Materials)',
                   '02_per_uc/US007/US007_activity.drawio',
                   act_repl,
                   page_width=1400, page_height=1100)

    # Sequence: PDF only -> PDF+PPTX
    # Sequence prefix: GC4UL6wOE1EOq1ZxUgT2
    seq_repl = {
        'File Storage': 'Supabase Storage',
        'Database': 'Supabase',
        'Select slides (PDF)': 'Select file (PDF or PPTX)',
        'Upload PDF': 'Upload to bucket course-materials',
    }
    process_per_uc(content, 'US007', 'GC4UL6wOE1EOq1ZxUgT2',
                   'US007 - Sequence Diagram (Update Materials)',
                   '02_per_uc/US007/US007_sequence.drawio',
                   seq_repl,
                   page_width=1400, page_height=1100)


# ---------------------------------------------------------------------------
# Top-level: sequence_whole
# ---------------------------------------------------------------------------

def build_sequence_whole(content):
    page_body = extract_page_body(content, 'sequence diagram whole')
    if not page_body:
        print("WARNING: page 'sequence diagram whole' not found")
        return

    # Comprehensive replacements for the whole system sequence
    repl = {
        'Auth API': 'Supabase Auth',
        'Course API': 'Backend API',
        'Public API': 'Backend API',
        'RAG Service': 'Backend API',
        'File Storage': 'Supabase Storage',
        'Database': 'Supabase',
        'Upload course info + slides (PDF)': 'Upload course info + slides (PDF or PPTX)',
        'POST /materials (metadata + file)': 'POST /api/materials/upload',
        'Upload PDF': 'Upload to bucket course-materials',
        'Save Document + metadata': 'INSERT materials + material_chunks',
        'POST /login': 'Initiate Google OAuth',
        'Verify User': 'Read role from auth.users',
        'POST /mini-courses': 'POST /api/courses/preview',
        'Create MiniCourse (Created)': 'Retrieve context via match_material_chunks',
        'Retrieve context + generate lesson/quiz': 'Generate lesson with [S#] + MCQ quiz',
        'POST /mini-courses/{courseId}/share': 'POST /api/courses/{id}/share',
        'Generate/update shareToken': 'Generate share_token, status=Shared',
        'GET /public/mini-courses/{shareToken}': 'GET /api/public/course/:token',
        'Find mini-course by token': 'SELECT lesson + questions',
        'POST /public/submissions': 'POST /api/public/course/:token/submit',
        'GET /mini-courses/{courseId}/submissions': 'GET /api/analytics/:courseId',
    }
    process_top_level(content, 'sequence diagram whole',
                      'Sequence Diagram for QUIZIFY (overall)',
                      '01_top_level/sequence_whole.drawio',
                      repl,
                      page_width=1400, page_height=1400)


# ---------------------------------------------------------------------------
# Top-level: component
# ---------------------------------------------------------------------------

def build_component(content):
    page_body = extract_page_body(content, 'component diagram')
    if not page_body:
        print("WARNING: page 'component diagram' not found")
        return

    # Replacements
    repl = {
        'Component Diagram: CES-SAIL': 'Component Diagram: QUIZIFY (Supabase)',
        '«subsystem»<br><b>Server (Back end)</b>': '«subsystem»<br><b>Backend API (Node.js + Express 4)</b>',
        '«subsystem»<br><b>Backend API</b>': '«subsystem»<br><b>Supabase</b>',
        '«subsystem»<br><b>Data Stores</b>': '',  # remove
        '«subsystem»<br><b>AI / Services</b>': '«subsystem»<br><b>LLM Providers</b>',
        '«component»<br><b>:Auth API</b>': '«component»<br><b>:Supabase Auth (Google)</b>',
        '«component»<br><b>:Course API</b>': '«component»<br><b>:Backend Services</b>',
        '«component»<br><b>:Public API</b>': '',  # remove
        '«component»<br><b>:RAG Service</b>': '«component»<br><b>:DeepSeek / Gemini</b>',
        '«component»<br><b>:LLM Provider</b>': '',  # remove
        '«component»<br><b>:Database</b>': '«component»<br><b>:PostgreSQL + pgvector</b>',
        '«component»<br><b>:File Storage</b>': '«component»<br><b>:Supabase Storage</b>',
        '«component»<br><b>:Vector Store</b>': '',  # remove
    }
    process_top_level(content, 'component diagram',
                      'Component Diagram: QUIZIFY',
                      '01_top_level/component.drawio',
                      repl,
                      page_width=1400, page_height=900)


# ---------------------------------------------------------------------------
# Top-level: package (pakage diagram)
# ---------------------------------------------------------------------------

def build_package(content):
    page_body = extract_page_body(content, 'pakage diagram')
    if not page_body:
        print("WARNING: page 'pakage diagram' not found")
        return

    repl = {
        'Package Diagram: CES-SAIL': 'Package Diagram: QUIZIFY (actual /src layout)',
        'P001 Authentication &amp; Authorization': 'controllers/ (materials, courses, public, analytics, students, health)',
        'P002 Admin Materials Management': 'services/ (materials, courses, rag, ai, quiz, outlines)',
        'P003 Mini-Course Orchestration': 'middleware/ (auth, error-handler) + lib/supabase.ts',
        'P004 Public Learning &amp; Assessment': 'types/ + config/ + data/',
        'P005 Analytics': 'routes/index.ts',
        'Database': 'Supabase PostgreSQL + pgvector',
        'File Storage': 'Supabase Storage',
        'RAG Service': 'LLM (DeepSeek / Gemini)',
        'Vector Store': '',  # remove
    }
    process_top_level(content, 'pakage diagram',
                      'Package Diagram: QUIZIFY',
                      '01_top_level/package.drawio',
                      repl,
                      page_width=1400, page_height=900)


# ---------------------------------------------------------------------------
# Top-level: erd
# ---------------------------------------------------------------------------

def build_erd(content):
    """Build ERD from scratch with the 6 Supabase tables."""
    er_style = (
        'rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;'
        'spacingLeft=10;spacingTop=10;fillColor=#FFFFFF;'
        'strokeColor=#000000;fontSize=14;fontFamily=Tahoma;'
    )
    edge_style = (
        'endArrow=ERmany;html=1;strokeColor=#000000;'
        'fontSize=14;fontFamily=Tahoma;'
    )
    write_file(
        '01_top_level/erd.drawio',
        wrap_in_drawio(
            'ERD - QUIZIFY (Supabase)',
            [
                c('title', 'ERD: QUIZIFY', STYLE_TITLE, 200, 30, 700, 30),
                c('materials',
                  'materials\n\nid, course_code,\nmaterial_type,\nchapter, file_name,\nstorage_path, status,\nchunk_count',
                  er_style, 40, 100, 220, 140),
                c('material_chunks',
                  'material_chunks\n\nid, material_id, course_code,\nsource_file, chapter,\nchunk_index, chunk_text,\nembedding vector(1536)',
                  er_style, 320, 100, 220, 140),
                c('mini_courses',
                  'mini_courses\n\nid, title, course_code,\ntopics, lesson_content,\nsources, status,\nshare_token, pass_percentage,\nexpires_at',
                  er_style, 40, 280, 220, 140),
                c('quizzes',
                  'quizzes\n\nid, mini_course_id,\ntitle, question_count',
                  er_style, 600, 100, 220, 100),
                c('questions',
                  'questions\n\nid, quiz_id, prompt,\noption_a, option_b,\noption_c, option_d,\ncorrect_option_index,\nexplanations, metadata',
                  er_style, 600, 240, 220, 140),
                c('quiz_attempts',
                  'quiz_attempts\n\nid, mini_course_id, quiz_id,\nstudent_name, student_email,\nscore, total_questions,\npercentage, submitted_answers',
                  er_style, 320, 280, 220, 140),
                c_edge('r1', 'has 1..*', edge_style, 'materials', 'material_chunks'),
                c_edge('r2', 'has 1..*', edge_style, 'mini_courses', 'quizzes'),
                c_edge('r3', 'has 1..*', edge_style, 'quizzes', 'questions'),
                c_edge('r4', 'receives 1..*', edge_style, 'mini_courses', 'quiz_attempts'),
                c_edge('r5', 'for 1..*', edge_style, 'quizzes', 'quiz_attempts'),
                c_edge('r6', 'references (via course_code)',
                       'endArrow=open;html=1;dashed=1;strokeColor=#000000;'
                       'fontSize=14;fontFamily=Tahoma;',
                       'mini_courses', 'materials'),
            ],
            page_width=900, page_height=500
        )
    )


# ---------------------------------------------------------------------------
# Top-level: domain_model (extract tables only, separate from state)
# ---------------------------------------------------------------------------

def build_domain_model(content):
    """Build domain model with just the 6 Supabase tables."""
    er_style = (
        'rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;'
        'spacingLeft=10;spacingTop=10;fillColor=#FFFFFF;'
        'strokeColor=#000000;fontSize=14;fontFamily=Tahoma;'
    )
    edge_style = (
        'endArrow=ERmany;html=1;strokeColor=#000000;'
        'fontSize=14;fontFamily=Tahoma;'
    )
    write_file(
        '01_top_level/domain_model.drawio',
        wrap_in_drawio(
            'Domain Model - QUIZIFY (Supabase)',
            [
                c('title', 'Domain Model: QUIZIFY', STYLE_TITLE, 200, 30, 700, 30),
                c('materials',
                  'materials\n\nid, course_code,\nmaterial_type,\nchapter, file_name,\nstorage_path, status,\nchunk_count',
                  er_style, 40, 100, 220, 140),
                c('material_chunks',
                  'material_chunks\n\nid, material_id, course_code,\nsource_file, chapter,\nchunk_index, chunk_text,\nembedding vector(1536)',
                  er_style, 320, 100, 220, 140),
                c('mini_courses',
                  'mini_courses\n\nid, title, course_code,\ntopics, lesson_content,\nsources, status,\nshare_token, pass_percentage',
                  er_style, 40, 280, 220, 140),
                c('quizzes',
                  'quizzes\n\nid, mini_course_id,\ntitle, question_count',
                  er_style, 600, 100, 220, 100),
                c('questions',
                  'questions\n\nid, quiz_id, prompt,\noption_a, option_b,\noption_c, option_d,\ncorrect_option_index,\nexplanations, metadata',
                  er_style, 600, 240, 220, 140),
                c('quiz_attempts',
                  'quiz_attempts\n\nid, mini_course_id, quiz_id,\nstudent_name, student_email,\nscore, total_questions,\npercentage, submitted_answers',
                  er_style, 320, 280, 220, 140),
                c_edge('r1', 'has 1..*', edge_style, 'materials', 'material_chunks'),
                c_edge('r2', 'has 1..*', edge_style, 'mini_courses', 'quizzes'),
                c_edge('r3', 'has 1..*', edge_style, 'quizzes', 'questions'),
                c_edge('r4', 'receives 1..*', edge_style, 'mini_courses', 'quiz_attempts'),
                c_edge('r5', 'for 1..*', edge_style, 'quizzes', 'quiz_attempts'),
            ],
            page_width=900, page_height=500
        )
    )


# ---------------------------------------------------------------------------
# Top-level: class
# ---------------------------------------------------------------------------

def build_class(content):
    """Build class diagram with the 6 Supabase tables (same as ERD but as classes)."""
    service_style = (
        'rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;'
        'spacingLeft=10;spacingTop=10;fillColor=#dae8fc;'
        'strokeColor=#6c8ebf;fontSize=12;fontFamily=Tahoma;'
    )
    entity_style = (
        'rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;'
        'spacingLeft=10;spacingTop=10;fillColor=#d5e8d4;'
        'strokeColor=#82b366;fontSize=12;fontFamily=Tahoma;'
    )
    uses_style = (
        'endArrow=open;html=1;strokeColor=#000000;dashed=1;'
        'fontSize=12;fontFamily=Tahoma;'
    )
    has_style = (
        'endArrow=ERmany;html=1;strokeColor=#000000;'
        'fontSize=12;fontFamily=Tahoma;'
    )
    write_file(
        '01_top_level/class.drawio',
        wrap_in_drawio(
            'Class Diagram - QUIZIFY (Service Modules + Domain)',
            [
                c('title', 'Class Diagram: QUIZIFY (service modules + domain entities)',
                  STYLE_TITLE, 100, 30, 900, 30),
                c('materials_service',
                  '«service» materials.service\n+listMaterials()\n+uploadMaterial(file, meta)\n+deleteMaterial(id)\n+deleteCourseMaterials(code)\n+deleteChapterMaterials(code)\n+reindexMaterial(id)\n+repairIndex()',
                  service_style, 40, 100, 240, 120),
                c('courses_service',
                  '«service» courses.service\n+listMiniCourses()\n+listAvailableCourses()\n+getCourseTopics(code)\n+reindexOutline(code)\n+generateCoursePreview(req)\n+confirmAndSaveCourse(req)\n+deleteMiniCourse(id)',
                  service_style, 320, 100, 240, 120),
                c('rag_service',
                  '«service» rag.service\n+extractText(file)\n+chunkText(text)\n+embedChunks(chunks)\n+matchChunks(code, embed)\n+extractAndSaveOutline(material)\n+getStoredOutline(code)',
                  service_style, 600, 100, 240, 120),
                c('ai_service',
                  '«service» ai.service\n+generateLesson(ctx, opts)\n+generateQuiz(lesson, opts)\n+embed(text)',
                  service_style, 40, 260, 240, 100),
                c('quiz_service',
                  '«service» quiz.service\n+getPublicCourse(token)\n+submitQuiz(token, payload)\n+computeAnalytics(courseId)\n+getStudentAttempts(userId)',
                  service_style, 320, 260, 240, 100),
                c('outlines_service',
                  '«service» outlines.service\n+extractAndSaveOutline(material)\n+getStoredOutline(code)',
                  service_style, 600, 260, 240, 100),
                c('materials',
                  '«entity» materials\n\nid, course_code,\nmaterial_type,\nchapter, file_name,\nstorage_path, status',
                  entity_style, 40, 400, 200, 120),
                c('material_chunks',
                  '«entity» material_chunks\n\nid, material_id,\ncourse_code,\nchunk_index, chunk_text,\nembedding vector(1536)',
                  entity_style, 280, 400, 200, 120),
                c('mini_courses',
                  '«entity» mini_courses\n\nid, title, course_code,\ntopics, lesson_content,\nstatus, share_token,\npass_percentage',
                  entity_style, 520, 400, 200, 120),
                c('quizzes',
                  '«entity» quizzes\n\nid, mini_course_id,\ntitle, question_count',
                  entity_style, 40, 560, 200, 80),
                c('questions',
                  '«entity» questions\n\nid, quiz_id, prompt,\noption_a..d,\ncorrect_option_index,\nexplanations, metadata',
                  entity_style, 280, 560, 200, 80),
                c('quiz_attempts',
                  '«entity» quiz_attempts\n\nid, mini_course_id,\nstudent_name, score,\npercentage,\nsubmitted_answers',
                  entity_style, 520, 560, 200, 80),
                c_edge('d1', '«uses»', uses_style, 'materials_service', 'materials'),
                c_edge('d2', '«uses»', uses_style, 'courses_service', 'materials_service'),
                c_edge('d3', '«uses»', uses_style, 'courses_service', 'rag_service'),
                c_edge('d4', '«uses»', uses_style, 'courses_service', 'ai_service'),
                c_edge('d5', '«uses»', uses_style, 'rag_service', 'material_chunks'),
                c_edge('d6', '«uses»', uses_style, 'quiz_service', 'quiz_attempts'),
                c_edge('d7', '«uses»', uses_style, 'outlines_service', 'materials'),
                c_edge('d8', '«has»', has_style, 'materials', 'material_chunks'),
                c_edge('d9', '«has»', has_style, 'mini_courses', 'quizzes'),
                c_edge('d10', '«has»', has_style, 'quizzes', 'questions'),
                c_edge('d11', '«receives»', has_style, 'mini_courses', 'quiz_attempts'),
            ],
            page_width=900, page_height=700
        )
    )


# ---------------------------------------------------------------------------
# Top-level: state_mini_course (3 states)
# ---------------------------------------------------------------------------

def build_state_mini_course(content):
    initial_style = 'ellipse;html=1;fillColor=#000000;strokeColor=#000000;'
    final_outer = 'ellipse;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;'
    final_inner = 'ellipse;html=1;fillColor=#000000;strokeColor=#000000;'
    write_file(
        '01_top_level/state_mini_course.drawio',
        wrap_in_drawio(
            'State Machine: MINI_COURSE',
            [
                c('title', 'State Machine: MINI_COURSE (3 states per Supabase CHECK)',
                  STYLE_TITLE, 200, 30, 700, 30),
                c('initial', '', initial_style, 60, 160, 20, 20),
                c('generating', 'Generating\n(RAG pipeline running)',
                  STYLE_PROCESS, 180, 140, 220, 70),
                c('ready', 'Ready\n(lesson + quiz stored)',
                  STYLE_PROCESS, 480, 140, 220, 70),
                c('shared', 'Shared\n(public link active)',
                  STYLE_PROCESS, 480, 280, 220, 70),
                c('final', '', final_outer, 780, 297, 26, 26),
                c('finalInner', '', final_inner, 786, 303, 14, 14),
                c_edge('t1', '', STYLE_EDGE, 'initial', 'generating'),
                c_edge('t2', 'Generation success', STYLE_EDGE, 'generating', 'ready'),
                c_edge('t3', 'Share link created', STYLE_EDGE, 'ready', 'shared'),
                c_edge('t4', 'Link expires / removed', STYLE_EDGE, 'shared', 'final'),
                c('note',
                  'Only 3 states per Supabase CHECK constraint\n(Generating, Ready, Shared). Failures are reported at the API level\nand stored in materials.error_message.',
                  STYLE_NOTE, 100, 380, 500, 60),
            ],
            page_width=900, page_height=500
        )
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    content = parse_source()

    print("=== Top-level diagrams ===")
    build_sequence_whole(content)
    build_component(content)
    build_package(content)
    build_erd(content)
    build_domain_model(content)
    build_class(content)
    build_state_mini_course(content)

    print("\n=== Per-UC diagrams ===")
    build_us001(content)
    build_us002(content)
    build_us004(content)
    build_us005(content)
    build_us007(content)

    print("\nDone. 16 files written.")


if __name__ == '__main__':
    main()
