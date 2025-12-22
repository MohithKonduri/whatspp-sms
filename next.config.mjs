/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: false,
        formats: ['image/avif', 'image/webp'],
    },
    staticPageGenerationTimeout: 180,
    output: 'standalone',
    // Enable experimental features for faster compilation
    experimental: {
        optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    },
    // Optimize compilation
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    // Externalize whatsapp-web.js and related packages to avoid bundling issues
    // This prevents Next.js from trying to bundle these packages
    serverExternalPackages: [
        'whatsapp-web.js',
        'puppeteer',
        'puppeteer-core',
        'qrcode-terminal',
        '@puppeteer/browsers',
    ],
    webpack: (config, {
        isServer
    }) => {
        if (isServer) {
            // Mark whatsapp-web.js as external for server-side
            config.externals = config.externals || []
            if (Array.isArray(config.externals)) {
                config.externals.push({
                    'whatsapp-web.js': 'commonjs whatsapp-web.js',
                    'puppeteer': 'commonjs puppeteer',
                    'puppeteer-core': 'commonjs puppeteer-core',
                    'qrcode-terminal': 'commonjs qrcode-terminal',
                })
            }
        }
        return config
    },
    turbopack: {
        // Ensure Next selects this folder as the workspace root during builds
        root: process.cwd(),
    },
}

export default nextConfig