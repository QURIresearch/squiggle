import type { Meta, StoryObj } from "@storybook/react";

import { MouseTooltip } from "../components/MouseTooltip.js";

/**
 * Renders the tooltip based on the mouse position. Useful for `<canvas>` elements.
 *
 * This component is somewhat laggy, I'm not sure why.
 */
const meta = { component: MouseTooltip } satisfies Meta<typeof MouseTooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: (
      <div className="flex h-24 w-24 border border-slate-200 p-1">Hover me</div>
    ),
    isOpen: true,
    render: () => <div>Tooltip text</div>,
  },
};
