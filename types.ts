
export interface SkillDistribution {
  category: string;
  share_percent: number;
}

export interface GapSkill {
  skill: string;
  current_level: number;
  required_level: number;
  priority: 'high' | 'medium' | 'low';
}

// New Competency Matrix Structures
export interface CompetencySkill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  evidence_source: 'resume' | 'github' | 'resume+github';
  evidence_comment: string;
}

export interface CompetencyArea {
  area: string;
  skills: CompetencySkill[];
}

export interface JDBreakdown {
  role_title: string;
  must_have_skills: string[];
  nice_to_have_skills: string[];
  responsibilities: string[];
  skill_frequency: { skill_name: string; count: number }[];
  estimated_level: string;
  company_archetype: string;
}

export interface CompanyFit {
  startup: number;
  mnc: number;
  saas: number;
  fintech: number;
  research_lab: number;
}

export interface PhaseEffort {
  programming?: number;
  data_analysis?: number;
  ml_ai?: number;
  extras?: number;
  projects?: number;
  interview_prep?: number;
}

export interface RoadmapEffort {
  phase_1: PhaseEffort;
  phase_2: PhaseEffort;
  phase_3: PhaseEffort;
}

export interface RoadmapTimelineItem {
    task_name: string;
    start_week: number; // 1-12
    end_week: number;   // 1-12
    category: 'Technical' | 'Project' | 'Career';
}

export interface EmployabilityProfile {
    current_visibility_score: number;
    phase_1_projected_score: number;
    phase_2_projected_score: number;
    phase_3_projected_score: number;
}

export interface TextSummaries {
  profile_summary: string;
  strengths: string[];
  weaknesses: string[];
  suggested_roles: string[];
  roadmap_summary: string;
}

export interface GithubProject {
  name: string;
  summary: string;
  tech_stack: string[];
  complexity_rating: number;
  resume_bullets: string[];
  improvement_suggestions: string[];
}

export interface ApplicationAssets {
  resume_bullets_optimized: string;
  cover_letter: string;
  linkedin_summary: string;
  outreach_message: string;
}

export interface MatchBreakdown {
    role: string;
    match_percentage: number;
}

export interface RadarCategory {
    category: string;
    score: number;
}

// Resume Highlights Interfaces
export interface ResumeHighlightSegment {
  id: string;
  section: string;
  original_text: string;
  rating: 'green' | 'yellow' | 'red';
  label: string;
  comment: string;
  suggested_text?: string;
}

export interface ResumeHighlightsResult {
  overall_feedback: string;
  segments: ResumeHighlightSegment[];
  summary_counts: {
    green: number;
    yellow: number;
    red: number;
  };
}

export interface AnalysisResult {
  overall_scores: {
    overall_match: number;
    categories: RadarCategory[];
    match_breakdown: MatchBreakdown[]; 
  };
  skill_distribution: SkillDistribution[];
  gap_skills: GapSkill[];
  competency_matrix: CompetencyArea[]; // Replaced fit_matrix
  jd_breakdown: JDBreakdown;
  company_fit: CompanyFit;
  roadmap_effort: RoadmapEffort;
  roadmap_details: {
      phase_1_goals: string[];
      phase_2_goals: string[];
      phase_3_goals: string[];
  };
  roadmap_timeline: RoadmapTimelineItem[];
  employability_profile: EmployabilityProfile;
  text_summaries: TextSummaries;
  github_projects: GithubProject[];
  assets: ApplicationAssets;
  portfolio_template: string; 
  resume_highlights?: ResumeHighlightsResult; // Optional as it might be null if analysis fails
}

// Add this to your types.ts file
export interface InterviewEvaluation {
  score: number;
  feedback: string;
  better_answer: string;
}

// UI State Types
export type ViewState = 'input' | 'analyzing' | 'dashboard';

export interface UserInputs {
  resumeFile: File | null;
  githubLinks: string;
  jdText: string;
}
