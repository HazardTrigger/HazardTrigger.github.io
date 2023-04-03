in vec3 vNormal;

out vec4 fragColor;

void main(){
    vec3 z=vec3(0.,0.,1.);
    float x=abs(dot(vNormal,z));
    float alpha=pow(1.-x,2.);
    fragColor=vec4(1.,1.,.3,alpha);
}
