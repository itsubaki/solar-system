export const ringVertexShader = `
varying float vUvRatio;
void main() {
  vUvRatio = uv.x;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const ringFragmentShader = `
uniform vec3 innerColor;
uniform vec3 outerColor;
uniform float innerAlpha;
uniform float outerAlpha;
varying float vUvRatio;
void main() {
  vec3 color = mix(innerColor, outerColor, vUvRatio);
  float alpha = mix(innerAlpha, outerAlpha, vUvRatio);
  gl_FragColor = vec4(color, alpha);
}`;
