import React from 'react';
import type { Question, VisualKind } from '../../types';
import { TenFrame, type TenFrameProps } from './TenFrame';
import { NumberLine, type NumberLineProps } from './NumberLine';
import { PlaceValueBlocks, type PlaceValueBlocksProps } from './PlaceValueBlocks';
import { Ruler, type RulerProps } from './Ruler';
import { ClockFace, type ClockFaceProps } from './ClockFace';

/**
 * T11C — Lesson-player visual renderer.
 *
 * A question may reference a `visual?: { kind, props }`; this component maps the
 * kind to the matching SVG visual in `src/components/visuals/` and renders it
 * inside the prompt card. Unknown kinds render nothing so a bad data entry can
 * never crash a lesson.
 *
 * T11B — same dispatcher with defensive numeric parsing + test hooks
 * (`data-testid="question-visual"`, `data-visual-kind`, `data-question-id`)
 * so hand-written props can never produce a meaningless figure.
 */
type VisualProps = { kind: VisualKind; props?: Record<string, unknown> };

function num(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Renders the SVG referenced by `question.visual` (T05 renderer hook, T11B/T11C). */
export const QuestionVisual: React.FC<{ visual: VisualProps | NonNullable<Question['visual']>; questionId?: string }> = ({
  visual,
  questionId,
}) => {
  const props = (visual.props ?? {}) as Record<string, unknown>;

  const renderInner = (): React.ReactNode => {
    switch (visual.kind) {
      case 'ClockFace': {
        const clockProps: ClockFaceProps = {
          gio: num(props.gio, 3),
          phut: num(props.phut, 0),
          amPm: props.amPm === 'chiều' ? 'chiều' : 'sáng',
        };
        return <ClockFace {...clockProps} />;
      }
      case 'Ruler': {
        const rulerProps: RulerProps = {
          length: num(props.length, 20),
          objectLength: props.objectLength === undefined ? undefined : num(props.objectLength, 0),
        };
        return <Ruler {...rulerProps} />;
      }
      case 'TenFrame': {
        // T11C legacy: `count` (0–20, multi-frame). T11B: `chuc`/`donVi`.
        if (props.count !== undefined) {
          return <TenFrame count={num(props.count, 0)} />;
        }
        const frameProps: TenFrameProps = {
          chuc: num(props.chuc, 0),
          donVi: num(props.donVi, 0),
          showTotal: props.showTotal === true,
        };
        return <TenFrame {...frameProps} />;
      }
      case 'NumberLine': {
        const lineProps: NumberLineProps = {
          start: num(props.start, 0),
          end: num(props.end, 20),
          step: props.step === undefined ? undefined : num(props.step, 1),
          current: props.current === undefined ? undefined : num(props.current, 0),
          missing: props.missing === undefined ? undefined : num(props.missing, 0),
        };
        return <NumberLine {...lineProps} />;
      }
      case 'PlaceValueBlocks': {
        const blockProps: PlaceValueBlocksProps = {
          chuc: num(props.chuc, 0),
          donVi: num(props.donVi, 0),
        };
        return <PlaceValueBlocks {...blockProps} />;
      }
      default:
        return null;
    }
  };

  return (
    <div
      className="flex justify-center my-2"
      data-testid="question-visual"
      data-visual-kind={visual.kind}
      data-question-id={questionId}
    >
      {renderInner()}
    </div>
  );
};

/** Convenience wrapper used by the lesson player. */
export const QuestionVisualForQuestion: React.FC<{ question: Question }> = ({ question }) => {
  if (!question.visual) return null;
  return <QuestionVisual visual={question.visual} questionId={question.id} />;
};

export default QuestionVisual;
