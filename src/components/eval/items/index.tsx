"use client";

import type { ItemComponentProps } from "./types";
import LikertItem from "./LikertItem";
import ForcedChoiceItem from "./ForcedChoiceItem";
import ScenarioItem from "./ScenarioItem";
import BudgetItem from "./BudgetItem";
import RankItem from "./RankItem";

export type { ItemComponentProps } from "./types";

/**
 * Dispatch an item to the component for its `item_type`. Unknown or missing
 * types fall back to the Likert rendering so a bad row can never crash the run.
 */
export function AssessmentItem(props: ItemComponentProps) {
  switch (props.item.item_type) {
    case "forced_choice":
      return <ForcedChoiceItem {...props} />;
    case "scenario":
      return <ScenarioItem {...props} />;
    case "budget":
      return <BudgetItem {...props} />;
    case "rank":
      return <RankItem {...props} />;
    case "likert":
    default:
      return <LikertItem {...props} />;
  }
}
