import { XRSessionManager } from '@/components/xr/XRSessionManager';

export default function XRPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Extended Reality Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Create immersive mixed reality experiences with haptic feedback and digital humans
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <XRSessionManager />
        </div>

        {/* Feature Overview */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🕶️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Mixed Reality</h3>
            <p className="text-gray-600">
              Holographic displays with spatial anchoring and hand tracking
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤲</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Haptic Feedback</h3>
            <p className="text-gray-600">
              Force feedback, temperature control, and spatial audio
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Digital Humans</h3>
            <p className="text-gray-600">
              Photorealistic avatars with emotion simulation and natural conversation
            </p>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Capabilities</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Features</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Real-time session management</li>
                <li>• Multi-user collaboration</li>
                <li>• Spatial audio processing</li>
                <li>• Neural rendering pipeline</li>
                <li>• Haptic device integration</li>
                <li>• Digital human AI</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enterprise Integration</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Zero-trust security architecture</li>
                <li>• Multi-tenant support</li>
                <li>• Compliance management</li>
                <li>• Audit trail logging</li>
                <li>• Performance monitoring</li>
                <li>• Scalable infrastructure</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}