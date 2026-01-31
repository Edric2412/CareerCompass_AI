from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Literal

# ---------------------------------------------------------
# Schemas
# ---------------------------------------------------------

class SkillDistribution(BaseModel):
    category: str
    share_percent: float

class GapSkill(BaseModel):
    skill: str
    current_level: float
    required_level: float
    priority: Literal['high', 'medium', 'low']

class CompetencySkill(BaseModel):
    name: str
    level: Literal['Beginner', 'Intermediate', 'Advanced', 'Expert']
    evidence_source: Literal['resume', 'github', 'resume+github']
    evidence_comment: str

class CompetencyArea(BaseModel):
    area: str
    skills: List[CompetencySkill]

class SkillFrequencyItem(BaseModel):
     skill_name: str
     count: int

class JDBreakdown(BaseModel):
    role_title: str
    must_have_skills: List[str]
    nice_to_have_skills: List[str]
    responsibilities: List[str]
    skill_frequency: List[SkillFrequencyItem]
    estimated_level: str
    company_archetype: str

class CompanyFit(BaseModel):
    startup: float
    mnc: float
    saas: float
    fintech: float
    research_lab: float

class MarketAnalysis(BaseModel):
    role_demand: Literal['High', 'Medium', 'Low']
    candidate_percentile: float = Field(description="Candidate's standing (0-100) relative to other applicants in the current market.")

class EffortCategory(BaseModel):
    category: str
    hours: float

class RoadmapEffort(BaseModel):
    phase_1: List[EffortCategory]
    phase_2: List[EffortCategory]
    phase_3: List[EffortCategory]

class RoadmapDetails(BaseModel):
    phase_1_goals: List[str]
    phase_2_goals: List[str]
    phase_3_goals: List[str]

class RoadmapTimelineItem(BaseModel):
    task_name: str
    start_week: int
    end_week: int
    category: str

class EmployabilityProfile(BaseModel):
    current_visibility_score: float
    phase_1_projected_score: float
    phase_2_projected_score: float
    phase_3_projected_score: float

class TextSummaries(BaseModel):
    candidate_name: Optional[str] = None
    candidate_headline: Optional[str] = None
    profile_summary: str
    strengths: List[str]
    weaknesses: List[str]
    suggested_roles: List[str]
    roadmap_summary: str

class GithubProject(BaseModel):
    name: str
    summary: str
    tech_stack: List[str]
    complexity_rating: float
    resume_bullets: List[str]
    improvement_suggestions: List[str]

class ApplicationAssets(BaseModel):
    resume_bullets_optimized: str
    cover_letter: str
    linkedin_summary: str
    outreach_message: str

class RadarCategory(BaseModel):
    category: str
    score: float

class MatchBreakdown(BaseModel):
    role: str
    match_percentage: float

class AnalyseResultOverallScores(BaseModel):
    overall_match: float
    categories: List[RadarCategory]
    match_breakdown: List[MatchBreakdown]

class ResumeHighlightSegment(BaseModel):
    id: str
    section: str
    original_text: str
    rating: Literal['green', 'yellow', 'red']
    label: str
    comment: str
    suggested_text: Optional[str] = None

class ResumeHighlightSummaryCounts(BaseModel):
    green: int
    yellow: int
    red: int

class ResumeHighlightsResult(BaseModel):
    overall_feedback: str
    segments: List[ResumeHighlightSegment]
    summary_counts: ResumeHighlightSummaryCounts

class AnalysisResult(BaseModel):
    overall_scores: AnalyseResultOverallScores
    market_analysis: MarketAnalysis
    skill_distribution: List[SkillDistribution]
    gap_skills: List[GapSkill]
    competency_matrix: List[CompetencyArea]
    jd_breakdown: JDBreakdown
    company_fit: CompanyFit
    roadmap_effort: RoadmapEffort
    roadmap_details: RoadmapDetails
    roadmap_timeline: List[RoadmapTimelineItem]
    employability_profile: EmployabilityProfile
    text_summaries: TextSummaries
    github_projects: List[GithubProject]
    assets: ApplicationAssets
    portfolio_template: str
    resume_highlights: Optional[ResumeHighlightsResult] = None
    interview_topics: Optional[List[str]] = None

# New for separate GitHub Analysis endpoint if needed
class GithubDeepAnalysisResult(BaseModel):
    project_name: str
    short_description: str
    project_type: str
    tech_stack: List[str]
    complexity_rating: float
    recommended_resume_bullets: List[str]
    improvement_suggestions: List[str]

# ---------------------------------------------------------
# Interview & Portfolio Schemas
# ---------------------------------------------------------

class InterviewQuestionRequest(BaseModel):
    role: str
    topic: str

class InterviewQuestionResponse(BaseModel):
    question_id: str
    question_text: str
    expected_keywords: List[str]
    hints: List[str]

class InterviewEvaluationRequest(BaseModel):
    question_text: str
    transcript: str

class InterviewEvaluationMetrics(BaseModel):
    clarity: int
    technical_accuracy: int
    confidence_estimate: float # 0.0 to 1.0

class InterviewEvaluationResponse(BaseModel):
    overall_score: int
    what_went_well: List[str]
    what_to_improve: List[str]
    better_answer: str
    metrics: InterviewEvaluationMetrics

class CustomLink(BaseModel):
    id: str
    label: str
    url: str

class PortfolioPreferences(BaseModel):
    color_theme: str
    mode: Literal['light', 'dark']
    corners: str
    layout_style: str
    font_vibe: str
    shadow_depth: Optional[str] = 'soft'
    density: Optional[str] = 'comfortable'
    animation_level: str
    nav_style: str
    avatar_style: Optional[str] = 'emoji'
    section_order: List[str]
    custom_links: List[CustomLink] = []
    contact_email: Optional[str] = ''
    contact_phone: Optional[str] = ''

class PortfolioRequest(BaseModel):
    analysis_result: AnalysisResult
    preferences: PortfolioPreferences

class PortfolioResponse(BaseModel):
    html_content: str
