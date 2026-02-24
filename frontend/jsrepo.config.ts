import { defineConfig } from 'jsrepo';
import stripTypes from '@jsrepo/transform-javascript';

export default defineConfig({
    // configure where stuff comes from here
    registries: [],
    // configure where stuff goes here
    paths: {
        component: './src/components',
        hook: './src/hooks',
        lib: './src/lib',
    },
	transforms: [stripTypes()]
});
