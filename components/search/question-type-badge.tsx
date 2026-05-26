import { Badge } from "@/components/ui/badge";
import {
  QUESTION_TYPE_LABELS,
  type QuestionType,
} from "@/lib/types/question-type";

type QuestionTypeBadgeProps = {
  questionType: QuestionType;
};

export function QuestionTypeBadge({ questionType }: QuestionTypeBadgeProps) {
  return (
    <Badge variant="outline" className="px-2 py-0.5 text-xs font-medium">
      {QUESTION_TYPE_LABELS[questionType]}
    </Badge>
  );
}
