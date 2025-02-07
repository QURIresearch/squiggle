import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Button } from "../components/Button.js";
import { Modal } from "../components/Modal.js";

const meta = { component: Modal } satisfies Meta<typeof Modal>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    close: () => undefined,
  },
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open modal</Button>
        {isOpen && (
          <Modal close={() => setIsOpen(false)}>
            <Modal.Header>Modal header</Modal.Header>
            <Modal.Body>Modal body</Modal.Body>
            <Modal.Footer>
              <Button onClick={() => setIsOpen(false)}>Close</Button>
            </Modal.Footer>
          </Modal>
        )}
      </>
    );
  },
};
