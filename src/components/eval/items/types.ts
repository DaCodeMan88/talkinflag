import type { PublicItem } from "@/lib/eval/load";
import type { ItemAnswer } from "@/lib/eval/item-types";

/**
 * Shared contract for every per-type assessment item component.
 * `value` is the current draft answer (undefined until touched).
 * `onChange` updates draft state; `onCommit` advances to the next item.
 * Auto-advance types (likert/forced_choice/scenario) call onChange then
 * onCommit on tap; budget/rank call onChange while editing and onCommit only
 * when the user presses Continue.
 */
export type ItemComponentProps = {
  item: PublicItem;
  value: ItemAnswer | undefined;
  onChange: (next: ItemAnswer) => void;
  onCommit: () => void;
  disabled?: boolean;
};
