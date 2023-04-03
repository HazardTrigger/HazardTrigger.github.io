out vec3 pos;
out vec2 vuv;
uniform vec3 bboxMin;
uniform vec3 bboxMax;
// https://stackoverflow.com/questions/52614371/apply-color-gradient-to-material-on-mesh-three-js
void main(){
    pos=position;
    vuv.y=(position.y-bboxMin.y) / (bboxMax.y - bboxMin.y);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}
