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


def extract_page_body(content, page_name):
    pattern = re.compile(
        rf'<diagram [^>]*name="{re.escape(page_name)}"[^>]*>(.*?)</diagram>',
        re.DOTALL
    )
    m = pattern.search(content)
    return m.group(1) if m else None


def extract_all_cells(page_body):
    cells = []
    for m in re.finditer(r'<mxCell\b.*?(?:/>|</mxCell>)', page_body, re.DOTALL):
        cells.append(m.group(0))
    return cells


def extract_cells_by_prefix(page_body, prefix):
    cells = []
    for m in re.finditer(r'<mxCell\b.*?(?:/>|</mxCell>)', page_body, re.DOTALL):
        cell_xml = m.group(0)
        id_match = re.search(r'id="([^"]+)"', cell_xml)
        if id_match and id_match.group(1).startswith(prefix):
            cells.append(cell_xml)
    return cells


def apply_text_replacements(cells, replacements):
    result = []
    for cell in cells:
        for old, new in replacements.items():
            if old in cell:
                cell = cell.replace(f'value="{old}"', f'value="{new}"')
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
        f'  <diagram name="{diagram_name}" id="{diagram_id}">\n'
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
    # Sequence: RAG Service / Database -> Supabase
    seq_repl = {
        'RAG Service': 'Supabase',
        'Database': 'Supabase',
        'Start RAG pipeline': 'match_material_chunks(course_code)',
        'Load course materials metadata': 'SELECT chunks WHERE course_code = $1',
        'Extract learning outcomes + relevant content': 'match_material_chunks returns top-k chunks',
        'Extracted context': 'Relevant context',
        'Context ready': 'Context ready',
    }
    process_per_uc(content, 'US002', 'MgEQ3kEXpOo1suhsOIaA',
                   'US002 - Sequence Diagram (Extract)',
                   '02_per_uc/US002/US002_sequence.drawio',
                   seq_repl)


# ---------------------------------------------------------------------------
# US004 - Create Quizzes (sequence only)
# ---------------------------------------------------------------------------

def build_us004(content):
    # Sequence: Save QuizQuestion + QuizOption -> questions table
    seq_repl = {
        'RAG Service': 'Backend API',
        'Database': 'Supabase',
        'Generate MCQ quiz set (questions + options)': 'Generate MCQ with Bloom/SOLO metadata + per-option explanations',
        'Quiz questions': 'Questions with option_a..d, explanations, metadata',
        'Save QuizQuestion + QuizOption': 'INSERT INTO questions (option_a..d, explanations, metadata)',
        'Quiz saved': 'Questions saved',
    }
    process_per_uc(content, 'US004', 'vokJg7HpGPeSaTTnsTay',
                   'US004 - Sequence Diagram (Create Quizzes)',
                   '02_per_uc/US004/US004_sequence.drawio',
                   seq_repl)


# ---------------------------------------------------------------------------
# US005 - View Analytics (activity + sequence)
# ---------------------------------------------------------------------------

def build_us005(content):
    # Activity: flat table -> rich dashboard
    act_repl = {
        'Display results table': 'Display analytics dashboard',
        'Display \'No submissions yet\'': 'Display "No submissions yet"',
    }
    process_per_uc(content, 'US005', '7J1mdU0mRvrNOPTbfz2r',
                   'US005 - Activity Diagram (View Analytics)',
                   '02_per_uc/US005/US005_activity.drawio',
                   act_repl)

    # Sequence: flat submissions -> CourseAnalytics
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
    act_repl = {
        'Select lecture slides (PDF)': 'Select lecture slides (PDF or PPTX)',
        'Upload slides to storage': 'Upload slides to storage',
    }
    process_per_uc(content, 'US007', 'GC4UL6wOE1EOq1ZxUgT2',
                   'US007 - Activity Diagram (Update Materials)',
                   '02_per_uc/US007/US007_activity.drawio',
                   act_repl,
                   page_width=1400, page_height=1100)

    # Sequence: PDF only -> PDF+PPTX
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
    write_file(
        '01_top_level/erd.drawio',
        wrap_in_drawio(
            'ERD - QUIZIFY (Supabase)',
            [
                # Title
                f'<mxCell id="title" value="ERD: QUIZIFY" style="{STYLE_TITLE}" vertex="1" parent="1">'
                f'<mxGeometry x="200" y="30" width="700" height="30" as="geometry"/></mxCell>',
                # materials
                f'<mxCell id="materials" value="materials&#xa;&#xa;id, course_code,&#xa;material_type,&#xa;chapter, file_name,&#xa;storage_path, status,&#xa;chunk_count" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#FFFFFF;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="40" y="100" width="220" height="140" as="geometry"/></mxCell>',
                # material_chunks
                f'<mxCell id="material_chunks" value="material_chunks&#xa;&#xa;id, material_id, course_code,&#xa;source_file, chapter,&#xa;chunk_index, chunk_text,&#xa;embedding vector(1536)" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#FFFFFF;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="320" y="100" width="220" height="140" as="geometry"/></mxCell>',
                # mini_courses
                f'<mxCell id="mini_courses" value="mini_courses&#xa;&#xa;id, title, course_code,&#xa;topics, lesson_content,&#xa;sources, status,&#xa;share_token, pass_percentage,&#xa;expires_at" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#FFFFFF;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="40" y="280" width="220" height="140" as="geometry"/></mxCell>',
                # quizzes
                f'<mxCell id="quizzes" value="quizzes&#xa;&#xa;id, mini_course_id,&#xa;title, question_count" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#FFFFFF;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="600" y="100" width="220" height="100" as="geometry"/></mxCell>',
                # questions
                f'<mxCell id="questions" value="questions&#xa;&#xa;id, quiz_id, prompt,&#xa;option_a, option_b,&#xa;option_c, option_d,&#xa;correct_option_index,&#xa;explanations, metadata" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#FFFFFF;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="600" y="240" width="220" height="140" as="geometry"/></mxCell>',
                # quiz_attempts
                f'<mxCell id="quiz_attempts" value="quiz_attempts&#xa;&#xa;id, mini_course_id, quiz_id,&#xa;student_name, student_email,&#xa;score, total_questions,&#xa;percentage, submitted_answers" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#FFFFFF;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="320" y="280" width="220" height="140" as="geometry"/></mxCell>',
                # Relationships
                f'<mxCell id="r1" value="has 1..*" style="endArrow=ERmany;html=1;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="materials" target="material_chunks"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="r2" value="has 1..*" style="endArrow=ERmany;html=1;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="mini_courses" target="quizzes"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="r3" value="has 1..*" style="endArrow=ERmany;html=1;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="quizzes" target="questions"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="r4" value="receives 1..*" style="endArrow=ERmany;html=1;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="mini_courses" target="quiz_attempts"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="r5" value="for 1..*" style="endArrow=ERmany;html=1;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="quizzes" target="quiz_attempts"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="r6" value="references (via course_code)" style="endArrow=open;html=1;dashed=1;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="mini_courses" target="materials"><mxGeometry relative="1" as="geometry"/></mxCell>',
            ],
            page_width=900, page_height=500
        )
    )


# ---------------------------------------------------------------------------
# Top-level: domain_model (extract tables only, separate from state)
# ---------------------------------------------------------------------------

def build_domain_model(content):
    """Build domain model with just the 6 Supabase tables."""
    write_file(
        '01_top_level/domain_model.drawio',
        wrap_in_drawio(
            'Domain Model - QUIZIFY (Supabase)',
            [
                # Title
                f'<mxCell id="title" value="Domain Model: QUIZIFY" style="{STYLE_TITLE}" vertex="1" parent="1">'
                f'<mxGeometry x="200" y="30" width="700" height="30" as="geometry"/></mxCell>',
                # materials
                f'<mxCell id="materials" value="materials&#xa;&#xa;id, course_code,&#xa;material_type,&#xa;chapter, file_name,&#xa;storage_path, status,&#xa;chunk_count" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#FFFFFF;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="40" y="100" width="220" height="140" as="geometry"/></mxCell>',
                # material_chunks
                f'<mxCell id="material_chunks" value="material_chunks&#xa;&#xa;id, material_id, course_code,&#xa;source_file, chapter,&#xa;chunk_index, chunk_text,&#xa;embedding vector(1536)" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#FFFFFF;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="320" y="100" width="220" height="140" as="geometry"/></mxCell>',
                # mini_courses
                f'<mxCell id="mini_courses" value="mini_courses&#xa;&#xa;id, title, course_code,&#xa;topics, lesson_content,&#xa;sources, status,&#xa;share_token, pass_percentage" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#FFFFFF;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="40" y="280" width="220" height="140" as="geometry"/></mxCell>',
                # quizzes
                f'<mxCell id="quizzes" value="quizzes&#xa;&#xa;id, mini_course_id,&#xa;title, question_count" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#FFFFFF;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="600" y="100" width="220" height="100" as="geometry"/></mxCell>',
                # questions
                f'<mxCell id="questions" value="questions&#xa;&#xa;id, quiz_id, prompt,&#xa;option_a, option_b,&#xa;option_c, option_d,&#xa;correct_option_index,&#xa;explanations, metadata" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#FFFFFF;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="600" y="240" width="220" height="140" as="geometry"/></mxCell>',
                # quiz_attempts
                f'<mxCell id="quiz_attempts" value="quiz_attempts&#xa;&#xa;id, mini_course_id, quiz_id,&#xa;student_name, student_email,&#xa;score, total_questions,&#xa;percentage, submitted_answers" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#FFFFFF;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="320" y="280" width="220" height="140" as="geometry"/></mxCell>',
                # Relationships
                f'<mxCell id="r1" value="has 1..*" style="endArrow=ERmany;html=1;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="materials" target="material_chunks"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="r2" value="has 1..*" style="endArrow=ERmany;html=1;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="mini_courses" target="quizzes"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="r3" value="has 1..*" style="endArrow=ERmany;html=1;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="quizzes" target="questions"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="r4" value="receives 1..*" style="endArrow=ERmany;html=1;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="mini_courses" target="quiz_attempts"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="r5" value="for 1..*" style="endArrow=ERmany;html=1;strokeColor=#000000;fontSize=14;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="quizzes" target="quiz_attempts"><mxGeometry relative="1" as="geometry"/></mxCell>',
            ],
            page_width=900, page_height=500
        )
    )


# ---------------------------------------------------------------------------
# Top-level: class
# ---------------------------------------------------------------------------

def build_class(content):
    """Build class diagram with the 6 Supabase tables (same as ERD but as classes)."""
    write_file(
        '01_top_level/class.drawio',
        wrap_in_drawio(
            'Class Diagram - QUIZIFY (Service Modules + Domain)',
            [
                # Title
                f'<mxCell id="title" value="Class Diagram: QUIZIFY (service modules + domain entities)" style="{STYLE_TITLE}" vertex="1" parent="1">'
                f'<mxGeometry x="100" y="30" width="900" height="30" as="geometry"/></mxCell>',
                # Service modules
                f'<mxCell id="materials_service" value="«service» materials.service&#xa;+listMaterials()&#xa;+uploadMaterial(file, meta)&#xa;+deleteMaterial(id)&#xa;+deleteCourseMaterials(code)&#xa;+deleteChapterMaterials(code)&#xa;+reindexMaterial(id)&#xa;+repairIndex()" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="40" y="100" width="240" height="120" as="geometry"/></mxCell>',
                f'<mxCell id="courses_service" value="«service» courses.service&#xa;+listMiniCourses()&#xa;+listAvailableCourses()&#xa;+getCourseTopics(code)&#xa;+reindexOutline(code)&#xa;+generateCoursePreview(req)&#xa;+confirmAndSaveCourse(req)&#xa;+deleteMiniCourse(id)" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="320" y="100" width="240" height="120" as="geometry"/></mxCell>',
                f'<mxCell id="rag_service" value="«service» rag.service&#xa;+extractText(file)&#xa;+chunkText(text)&#xa;+embedChunks(chunks)&#xa;+matchChunks(code, embed)&#xa;+extractAndSaveOutline(material)&#xa;+getStoredOutline(code)" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="600" y="100" width="240" height="120" as="geometry"/></mxCell>',
                f'<mxCell id="ai_service" value="«service» ai.service&#xa;+generateLesson(ctx, opts)&#xa;+generateQuiz(lesson, opts)&#xa;+embed(text)" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="40" y="260" width="240" height="100" as="geometry"/></mxCell>',
                f'<mxCell id="quiz_service" value="«service» quiz.service&#xa;+getPublicCourse(token)&#xa;+submitQuiz(token, payload)&#xa;+computeAnalytics(courseId)&#xa;+getStudentAttempts(userId)" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="320" y="260" width="240" height="100" as="geometry"/></mxCell>',
                f'<mxCell id="outlines_service" value="«service» outlines.service&#xa;+extractAndSaveOutline(material)&#xa;+getStoredOutline(code)" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="600" y="260" width="240" height="100" as="geometry"/></mxCell>',
                # Domain entities
                f'<mxCell id="materials" value="«entity» materials&#xa;&#xa;id, course_code,&#xa;material_type,&#xa;chapter, file_name,&#xa;storage_path, status" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#d5e8d4;strokeColor=#82b366;fontSize=12;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="40" y="400" width="200" height="120" as="geometry"/></mxCell>',
                f'<mxCell id="material_chunks" value="«entity» material_chunks&#xa;&#xa;id, material_id,&#xa;course_code,&#xa;chunk_index, chunk_text,&#xa;embedding vector(1536)" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#d5e8d4;strokeColor=#82b366;fontSize=12;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="280" y="400" width="200" height="120" as="geometry"/></mxCell>',
                f'<mxCell id="mini_courses" value="«entity» mini_courses&#xa;&#xa;id, title, course_code,&#xa;topics, lesson_content,&#xa;status, share_token,&#xa;pass_percentage" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#d5e8d4;strokeColor=#82b366;fontSize=12;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="520" y="400" width="200" height="120" as="geometry"/></mxCell>',
                f'<mxCell id="quizzes" value="«entity» quizzes&#xa;&#xa;id, mini_course_id,&#xa;title, question_count" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#d5e8d4;strokeColor=#82b366;fontSize=12;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="40" y="560" width="200" height="80" as="geometry"/></mxCell>',
                f'<mxCell id="questions" value="«entity» questions&#xa;&#xa;id, quiz_id, prompt,&#xa;option_a..d,&#xa;correct_option_index,&#xa;explanations, metadata" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#d5e8d4;strokeColor=#82b366;fontSize=12;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="280" y="560" width="200" height="80" as="geometry"/></mxCell>',
                f'<mxCell id="quiz_attempts" value="«entity» quiz_attempts&#xa;&#xa;id, mini_course_id,&#xa;student_name, score,&#xa;percentage,&#xa;submitted_answers" '
                f'style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;'
                f'fillColor=#d5e8d4;strokeColor=#82b366;fontSize=12;fontFamily=Tahoma;" vertex="1" parent="1">'
                f'<mxGeometry x="520" y="560" width="200" height="80" as="geometry"/></mxCell>',
                # Dependencies
                f'<mxCell id="d1" value="«uses»" style="endArrow=open;html=1;strokeColor=#000000;dashed=1;fontSize=12;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="materials_service" target="materials"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="d2" value="«uses»" style="endArrow=open;html=1;strokeColor=#000000;dashed=1;fontSize=12;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="courses_service" target="materials_service"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="d3" value="«uses»" style="endArrow=open;html=1;strokeColor=#000000;dashed=1;fontSize=12;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="courses_service" target="rag_service"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="d4" value="«uses»" style="endArrow=open;html=1;strokeColor=#000000;dashed=1;fontSize=12;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="courses_service" target="ai_service"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="d5" value="«uses»" style="endArrow=open;html=1;strokeColor=#000000;dashed=1;fontSize=12;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="rag_service" target="material_chunks"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="d6" value="«uses»" style="endArrow=open;html=1;strokeColor=#000000;dashed=1;fontSize=12;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="quiz_service" target="quiz_attempts"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="d7" value="«uses»" style="endArrow=open;html=1;strokeColor=#000000;dashed=1;fontSize=12;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="outlines_service" target="materials"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="d8" value="«has»" style="endArrow=ERmany;html=1;strokeColor=#000000;fontSize=12;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="materials" target="material_chunks"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="d9" value="«has»" style="endArrow=ERmany;html=1;strokeColor=#000000;fontSize=12;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="mini_courses" target="quizzes"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="d10" value="«has»" style="endArrow=ERmany;html=1;strokeColor=#000000;fontSize=12;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="quizzes" target="questions"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="d11" value="«receives»" style="endArrow=ERmany;html=1;strokeColor=#000000;fontSize=12;fontFamily=Tahoma;" edge="1" parent="1" '
                f'source="mini_courses" target="quiz_attempts"><mxGeometry relative="1" as="geometry"/></mxCell>',
            ],
            page_width=900, page_height=700
        )
    )


# ---------------------------------------------------------------------------
# Top-level: state_mini_course (3 states)
# ---------------------------------------------------------------------------

def build_state_mini_course(content):
    write_file(
        '01_top_level/state_mini_course.drawio',
        wrap_in_drawio(
            'State Machine: MINI_COURSE',
            [
                # Title
                f'<mxCell id="title" value="State Machine: MINI_COURSE (3 states per Supabase CHECK)" style="{STYLE_TITLE}" vertex="1" parent="1">'
                f'<mxGeometry x="200" y="30" width="700" height="30" as="geometry"/></mxCell>',
                # Initial
                f'<mxCell id="initial" value="" style="ellipse;html=1;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">'
                f'<mxGeometry x="60" y="160" width="20" height="20" as="geometry"/></mxCell>',
                # Generating
                f'<mxCell id="generating" value="Generating&#xa;(RAG pipeline running)" style="{STYLE_PROCESS}" vertex="1" parent="1">'
                f'<mxGeometry x="180" y="140" width="220" height="70" as="geometry"/></mxCell>',
                # Ready
                f'<mxCell id="ready" value="Ready&#xa;(lesson + quiz stored)" style="{STYLE_PROCESS}" vertex="1" parent="1">'
                f'<mxGeometry x="480" y="140" width="220" height="70" as="geometry"/></mxCell>',
                # Shared
                f'<mxCell id="shared" value="Shared&#xa;(public link active)" style="{STYLE_PROCESS}" vertex="1" parent="1">'
                f'<mxGeometry x="480" y="280" width="220" height="70" as="geometry"/></mxCell>',
                # Terminal
                f'<mxCell id="final" value="" style="ellipse;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;" vertex="1" parent="1">'
                f'<mxGeometry x="780" y="297" width="26" height="26" as="geometry"/></mxCell>',
                f'<mxCell id="finalInner" value="" style="ellipse;html=1;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">'
                f'<mxGeometry x="786" y="303" width="14" height="14" as="geometry"/></mxCell>',
                # Transitions
                f'<mxCell id="t1" value="" style="{STYLE_EDGE}" edge="1" parent="1" '
                f'source="initial" target="generating"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="t2" value="Generation success" style="{STYLE_EDGE}" edge="1" parent="1" '
                f'source="generating" target="ready"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="t3" value="Share link created" style="{STYLE_EDGE}" edge="1" parent="1" '
                f'source="ready" target="shared"><mxGeometry relative="1" as="geometry"/></mxCell>',
                f'<mxCell id="t4" value="Link expires / removed" style="{STYLE_EDGE}" edge="1" parent="1" '
                f'source="shared" target="final"><mxGeometry relative="1" as="geometry"/></mxCell>',
                # Note
                f'<mxCell id="note" value="Only 3 states per Supabase CHECK constraint&#xa;(Generating, Ready, Shared). Failures are reported at the API level&#xa;and stored in materials.error_message." '
                f'style="{STYLE_NOTE}" vertex="1" parent="1">'
                f'<mxGeometry x="100" y="380" width="500" height="60" as="geometry"/></mxCell>',
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
