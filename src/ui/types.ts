export interface Item {
  id: string
  hanzi: string
  pinyin: string
  vi: string
  audio: string | null
}

export interface Exercise {
  id: string
  type: 'tone_choice' | 'audio_choice' | 'meaning_choice' | 'order'
  promptVi: string
  itemIds: string[]
  choices: { id: string; label: string; itemId?: string }[]
  answerIds: string[]
  explanationVi: string
}

export interface LessonSummary {
  id: string
  title: string
  status: 'available' | 'completed' | 'locked'
}

export interface ModuleSummary {
  id: string
  title: string
  lessons: LessonSummary[]
}

export interface HomeProps {
  nextLesson?: LessonSummary
  completedCount: number
  reviewCount: number
  modules: ModuleSummary[]
  onStart: (id: string) => void
  onReview: () => void
  onProgress: () => void
}

export interface PracticeStep {
  id: string
  itemIds: string[]
  exercise?: Exercise
}

export interface PracticeProps {
  steps: PracticeStep[]
  items: Record<string, Item>
  stepIndex: number
  feedback?: { correct: boolean; explanationVi: string }
  showPinyin: boolean
  onTogglePinyin: (show: boolean) => void
  onSubmit: (ids: string[]) => void
  onNext: () => void
  onExit: () => void
  resolveAudio?: (relativePath: string) => string
}

export interface LessonProps extends PracticeProps {
  title: string
  objective: string
  locked?: boolean
}

export interface ReviewProps extends PracticeProps {
  dueCount: number
  currentItem?: Item
}

export interface ProgressProps {
  modules: ModuleSummary[]
  currentModuleId?: string
  reviewCount: number
  onExit: () => void
  onReview: () => void
}
