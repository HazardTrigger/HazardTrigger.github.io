in vec3 pos;
in vec2 vuv;

uniform vec3 color1;
uniform vec3 color2;
uniform float time;

out vec4 fragColor;

// https://stackoverflow.com/questions/52614371/apply-color-gradient-to-material-on-mesh-three-js
void main(){
    fragColor=vec4(mix(color1,color2,vuv.y),1.0);
}
