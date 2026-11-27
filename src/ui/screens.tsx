import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { HomeProps, Item, LessonProps, ModuleSummary, PracticeProps, ProgressProps, ReviewProps } from './types'
import './styles.css'

function Screen({ title, onExit, children }: { title: string; onExit?: () => void; children: ReactNode }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [title])
  return <main className="tt-screen">
    <header className="tt-header">
      {onExit ? <button onClick={onExit}>← Trang chủ</button> : <span>Tiếng Trung Từ Đầu</span>}
    </header>
    <h1 ref={heading} tabIndex={-1}>{title}</h1>
    {children}
  </main>
}

const statusText = { available: 'Có thể học', completed: 'Đã hoàn thành', locked: 'Đang khóa' }

function Roadmap({ modules, currentModuleId, onStart }: {
  modules: ModuleSummary[]; currentModuleId?: string; onStart?: (id: string) => void
}) {
  return <div className="tt-grid">{modules.map(module => <section key={module.id} className="tt-panel">
    <h3>{module.title}</h3>
    {module.id === currentModuleId && <p>Chặng đang học</p>}
    <ul className="tt-roadmap">{module.lessons.map(lesson => <li key={lesson.id}>
      {onStart && lesson.status !== 'locked'
        ? <button onClick={() => onStart(lesson.id)}>{lesson.title}</button>
        : <span>{lesson.title}</span>}
      <small>{statusText[lesson.status]}</small>
    </li>)}</ul>
  </section>)}</div>
}

export function HomeScreen(props: HomeProps) {
  const { nextLesson, completedCount, reviewCount, modules, onStart, onReview, onProgress } = props
  return <Screen title="Hôm nay học gì?">
    <div className="tt-home">
      <section className="tt-panel tt-feature">
        <h2>{nextLesson?.title ?? 'Bạn đã hoàn thành lộ trình'}</h2>
        {nextLesson && nextLesson.status !== 'locked' &&
          <button className="tt-primary" onClick={() => onStart(nextLesson.id)}>{completedCount ? 'Học tiếp' : 'Học bài đầu'}</button>}
        {nextLesson?.status === 'locked' && <p>Hoàn thành bài trước để mở bài này.</p>}
      </section>
      <section className="tt-panel">
        <h2>{reviewCount} mục cần ôn</h2>
        <div className="tt-actions"><button onClick={onReview}>Ôn tập</button><button onClick={onProgress}>Tiến độ</button></div>
      </section>
    </div>
    <h2>Lộ trình học</h2>
    <Roadmap modules={modules} onStart={onStart} />
  </Screen>
}

export function ProgressScreen({ modules, currentModuleId, reviewCount, onExit, onReview }: ProgressProps) {
  const lessons = modules.flatMap(module => module.lessons)
  const completed = lessons.filter(lesson => lesson.status === 'completed').length
  return <Screen title="Tiến độ học" onExit={onExit}>
    <section className="tt-panel">
      <p><strong>{completed}/{lessons.length} bài đã hoàn thành</strong></p>
      {lessons.length > 0 && <progress aria-label="Tiến độ toàn khóa" max={lessons.length} value={completed} />}
      <p>{reviewCount} mục đến hạn ôn</p>
      <button onClick={onReview}>Mở bài ôn</button>
    </section>
    <h2>Lộ trình học</h2>
    <Roadmap modules={modules} currentModuleId={currentModuleId} />
  </Screen>
}

function AudioControl({ src }: { src?: string }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [state, setState] = useState<'ready' | 'playing' | 'played' | 'error'>('ready')
  async function play() {
    const player = audio.current
    if (!player) return
    try {
      if (player.error) player.load()
      player.currentTime = 0
      await player.play()
    } catch {
      setState('error')
    }
  }
  if (!src) return <p className="tt-muted">Mục này chưa có âm thanh.</p>
  return <div className="tt-audio">
    <audio ref={audio} src={src} preload="none" onPlaying={() => setState('playing')}
      onEnded={() => setState('played')} onError={() => setState('error')} />
    <button onClick={play}>{state === 'ready' ? 'Nghe âm thanh' : 'Phát lại âm thanh'}</button>
    <span role="status">{state === 'playing' ? 'Đang phát' : state === 'error' ? 'Không phát được âm thanh.' : ''}</span>
  </div>
}

function Practice(props: PracticeProps) {
  const step = props.steps[props.stepIndex]
  return step ? <Step key={step.id} {...props} /> : <p role="status">Không tải được nội dung luyện tập.</p>
}

function Step({ steps, stepIndex, items, feedback, showPinyin, onTogglePinyin, onSubmit, onNext, resolveAudio }: PracticeProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const step = steps[stepIndex]
  const exercise = step.exercise
  const order = exercise?.type === 'order'
  const listening = exercise?.type === 'audio_choice' || exercise?.type === 'tone_choice'
  const last = stepIndex === steps.length - 1
  const next = useRef<HTMLButtonElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [step.id])
  useEffect(() => { if (feedback) next.current?.focus() }, [feedback])
  const itemIds = exercise?.itemIds.length ? exercise.itemIds : step.itemIds
  function renderItem(item: Item) {
    const audioPath = item.audio
    return <div className="tt-card" key={item.id}>
      {!listening && <div lang="zh-Hans" className="tt-hanzi">{item.hanzi}</div>}
      {!exercise && showPinyin && <p lang="zh-Latn-pinyin">{item.pinyin}</p>}
      {!exercise && <p>{item.vi}</p>}
      {(!exercise || listening) && <AudioControl src={audioPath ? (resolveAudio ? resolveAudio(audioPath) : audioPath) : undefined} />}
    </div>
  }
  const ready = order ? selected.length === exercise?.choices.length : selected.length === 1
  return <section className="tt-panel tt-practice">
    <div className="tt-actions tt-step">
      <label>Phần {stepIndex + 1}/{steps.length}<progress max={steps.length} value={stepIndex + 1} /></label>
      <label className="tt-toggle"><input type="checkbox" checked={showPinyin} onChange={event => onTogglePinyin(event.target.checked)} /> Hiện pinyin khi học từ</label>
    </div>
    <h2 ref={heading} tabIndex={-1}>{exercise?.promptVi ?? 'Làm quen với từ mới'}</h2>
    <div className="tt-items">{itemIds.map(id => items[id] ? renderItem(items[id]) : <p key={id} role="status">Thiếu dữ liệu cho mục này.</p>)}</div>
    {exercise && <div>
      {order && <div className="tt-order">
        <p>Thứ tự đã chọn</p>
        <ol>{selected.map(id => <li key={id}>{exercise.choices.find(choice => choice.id === id)?.label}</li>)}</ol>
        <button disabled={!selected.length || !!feedback || submitting} onClick={() => setSelected(selected.slice(0, -1))}>Bỏ từ cuối</button>
      </div>}
      <div className="tt-choices" role="group" aria-label="Lựa chọn đáp án">
        {exercise.choices.map(choice => {
          const hanzi = choice.itemId ? items[choice.itemId]?.hanzi : undefined
          const label = choice.label || hanzi
          return <button key={choice.id} aria-pressed={selected.includes(choice.id)}
            disabled={!!feedback || submitting || (order && selected.includes(choice.id))}
            onClick={() => setSelected(order ? [...selected, choice.id] : [choice.id])}
            lang={label && /\p{Script=Han}/u.test(label) ? 'zh-Hans' : undefined}>
            {label}
          </button>
        })}
      </div>
    </div>}
    {feedback && <div role="status" className={feedback.correct ? 'tt-feedback tt-correct' : 'tt-feedback tt-incorrect'}>
      <strong>{feedback.correct ? 'Chính xác' : 'Chưa đúng'}</strong><p>{feedback.explanationVi}</p>
    </div>}
    <div className="tt-actions">
      {exercise && !feedback
        ? <button className="tt-primary" disabled={!ready || submitting} onClick={() => { setSubmitting(true); onSubmit(selected) }}>Kiểm tra</button>
        : <button className="tt-primary" ref={next} onClick={onNext}>{last ? 'Hoàn thành' : 'Tiếp tục'}</button>}
    </div>
  </section>
}

export function LessonScreen(props: LessonProps) {
  return <Screen title={props.title} onExit={props.onExit}>
    <p className="tt-objective">{props.objective}</p>
    {props.locked ? <section className="tt-panel"><h2>Bài đang khóa</h2><p>Hoàn thành bài tiên quyết để mở bài này.</p></section> : <Practice {...props} />}
  </Screen>
}

export function ReviewScreen(props: ReviewProps) {
  return <Screen title="Ôn tập" onExit={props.onExit}>
    {props.dueCount === 0
      ? <section className="tt-panel"><h2>Chưa có mục cần ôn</h2><p>Bạn có thể học tiếp từ trang chủ.</p></section>
      : <><p>{props.dueCount} mục đến hạn ôn{props.currentItem ? ' · Đang luyện mục ' + (props.stepIndex + 1) : ''}</p>
        {props.currentItem && !['audio_choice', 'tone_choice'].includes(props.steps[props.stepIndex]?.exercise?.type ?? '') &&
          <p>Đang luyện <strong lang="zh-Hans">{props.currentItem.hanzi}</strong></p>}
        <Practice {...props} /></>}
  </Screen>
}

export function DataErrorScreen({ onRetry, onExit }: { onRetry?: () => void; onExit?: () => void }) {
  return <Screen title="Không tải được dữ liệu" onExit={onExit}>
    <p role="alert">Nội dung học chưa sẵn sàng.</p>
    {onRetry && <button onClick={onRetry}>Thử lại</button>}
  </Screen>
}
