import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'],
  viteFinal: async (config) => {
    // Set higher esbuild target to support modern JS features (destructuring, etc.)
    config.esbuild = {
      ...config.esbuild,
      target: 'es2022',
    };
    // Also set build target for storybook build
    if (config.build) {
      config.build.target = 'es2022';
    }
    return config;
  },
};

export default config;