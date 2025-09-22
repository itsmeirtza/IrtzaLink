# 3D Layer Setup (Web + Mobile)

This repo adds non-invasive 3D scaffolding to both web and mobile to enable a pro-level, animated UI.

Web (React)
- Dependencies added: three, @react-three/fiber, @react-three/drei
- A background scene is mounted via src/components/ThreeBackground.jsx
- It renders behind all content and is pointerEvents: none to avoid interfering with UI
- Extend this scene with models, shader materials, and per-page transitions

Mobile (Flutter)
- A Pro3DHero widget (lib/widgets/pro_3d_hero.dart) demonstrates a 3D perspective transform with depth/parallax and shadowing
- Use this to wrap hero sections, profile cards, and QR previews
- For deeper 3D (meshes/shaders), we can add flutter_gl + three_dart or integrate Rive scenes

Performance Notes
- Keep lights/material counts low on low-end devices
- Prefer lazy mounting for heavy scenes
- Measure FPS and memory on physical devices

Next Steps
- Replace the placeholder geometry with brand visuals (logo, cards)
- Add page transition animations that sync with route changes
- Consider adding Rive for micro-interactions (buttons, toggles)
