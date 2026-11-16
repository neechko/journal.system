import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../Button/Button';
import { Modal } from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'Design System/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
    closeOnOverlayClick: { control: 'boolean' },
    closeOnEscape: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

const ModalDemo = ({ ...props }: React.ComponentProps<typeof Modal>) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        {...props}
      >
        <p>This is the modal content. You can put any content here.</p>
        <p style={{ marginTop: '16px' }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      </Modal>
    </>
  );
};

export const Default: Story = {
  render: (args) => <ModalDemo {...args} />,
  args: {
    title: 'Modal Title',
    description: 'This is a description of the modal.',
  },
};

export const Small: Story = {
  render: (args) => <ModalDemo {...args} />,
  args: {
    title: 'Small Modal',
    size: 'sm',
  },
};

export const Large: Story = {
  render: (args) => <ModalDemo {...args} />,
  args: {
    title: 'Large Modal',
    size: 'lg',
  },
};

export const FullScreen: Story = {
  render: (args) => <ModalDemo {...args} />,
  args: {
    title: 'Full Screen Modal',
    size: 'full',
  },
};

export const ConfirmationDialog: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Delete Item
        </Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Confirm Deletion"
          description="This action cannot be undone."
          size="sm"
        >
          <p>Are you sure you want to delete this item? This will permanently remove it from the system.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => setIsOpen(false)}>Delete</Button>
          </div>
        </Modal>
      </>
    );
  },
};

export const FormModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Form</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Create New Article"
          description="Fill in the details below to create a new article."
          size="md"
        >
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Title</label>
              <input type="text" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }} placeholder="Enter article title" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Abstract</label>
              <textarea style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', minHeight: '100px' }} placeholder="Enter abstract" />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Create</Button>
            </div>
          </form>
        </Modal>
      </>
    );
  },
};

export const WithoutCloseButton: Story = {
  render: (args) => <ModalDemo {...args} />,
  args: {
    title: 'No Close Button',
    showCloseButton: false,
    description: 'This modal does not have a close button in the header.',
  },
};