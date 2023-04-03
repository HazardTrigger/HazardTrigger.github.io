#version 300 es

precision highp float;

out vec4 fragColor;

in vec2 texCoords;

uniform sampler2D texture_diffuse;
uniform sampler2D texture_specular;
uniform sampler2D texture_normal;
uniform sampler2D texture_height;

void main() {
    fragColor = texture(texture_diffuse, texCoords);
    // fragColor = vec4(1.0f, 1.0f, 1.0f, 1.0f);
}
