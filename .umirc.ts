import { defineConfig } from 'umi';

export default defineConfig({
    nodeModulesTransform: {
        type: 'none',
    },
    routes: [{ path: '/', component: '@/pages/index' }],
    chainWebpack(memo, args) {
        memo.module
            .rule('shaderLoader')
            .test(/\.(glsl|vs|fs|vert|frag|comp|wgsl)$/)
            .use('shaderLoader')
            .loader('ts-shader-loader');
    },
    fastRefresh: {},
    webpack5: {},
});
