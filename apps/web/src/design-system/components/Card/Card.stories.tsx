import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Design System/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'bordered', 'elevated', 'outlined'],
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    hoverable: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card style={{ width: '350px' }}>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>This is a description of the card content.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>The main content of the card goes here. You can add any content you need.</p>
      </CardContent>
      <CardFooter>
        <button>Action</button>
      </CardFooter>
    </Card>
  ),
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
  render: (args: React.ComponentProps<typeof Card>) => (
    <Card {...args} style={{ width: '350px' }}>
      <CardHeader>
        <CardTitle>Outlined Card</CardTitle>
        <CardDescription>This card has an outlined variant.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Content with outlined styling.</p>
      </CardContent>
    </Card>
  ),
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
  },
  render: (args: React.ComponentProps<typeof Card>) => (
    <Card {...args} style={{ width: '350px' }}>
      <CardHeader>
        <CardTitle>Elevated Card</CardTitle>
        <CardDescription>This card has an elevated shadow.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Content with elevated styling.</p>
      </CardContent>
    </Card>
  ),
};

export const Filled: Story = {
  args: {
    variant: 'filled',
  },
  render: (args: React.ComponentProps<typeof Card>) => (
    <Card {...args} style={{ width: '350px' }}>
      <CardHeader>
        <CardTitle>Filled Card</CardTitle>
        <CardDescription>This card has a filled background.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Content with filled styling.</p>
      </CardContent>
    </Card>
  ),
};

export const Hoverable: Story = {
  args: {
    hoverable: true,
  },
  render: (args: React.ComponentProps<typeof Card>) => (
    <Card {...args} style={{ width: '350px' }}>
      <CardHeader>
        <CardTitle>Hoverable Card</CardTitle>
        <CardDescription>Hover over this card to see the effect.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This card has hover effects enabled.</p>
      </CardContent>
    </Card>
  ),
};

export const Simple: Story = {
  render: () => (
    <Card style={{ width: '300px', padding: '16px' }}>
      <p>Simple card without header/footer.</p>
    </Card>
  ),
};

export const ArticleCard: Story = {
  render: () => (
    <Card variant="outlined" hoverable style={{ width: '350px' }}>
      <CardHeader>
        <CardTitle>Understanding Quantum Computing</CardTitle>
        <CardDescription>Published in Journal of Computer Science • March 15, 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Quantum computing represents a fundamental shift in computational paradigms...</p>
      </CardContent>
      <CardFooter>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>12 min read</span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>4.2k views</span>
        </div>
      </CardFooter>
    </Card>
  ),
};