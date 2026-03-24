/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: [
        {
          loader: 'raw-loader',
          options: { esModule: false },
        },
        'glslify-loader',
      ],
    });
    return config;
  },
  turbopack: {
    rules: {
      '*.glsl': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
      '*.vert': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
      '*.frag': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;