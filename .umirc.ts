import { defineConfig } from 'umi';

export default defineConfig({
    nodeModulesTransform: {
        type: 'none',
    },
    routes: [
        {
            path: '/',
            component: '@/pages/index',
        },
        { path: '/gltfEngine', component: '@/pages/GLTFEngine/index' },
        { path: '/smartCity', component: '@/pages/SmartCity/index' },
        { path: '/tiles2dEngine', component: '@/pages/Tiles2DEngine/index' },
    ],
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
