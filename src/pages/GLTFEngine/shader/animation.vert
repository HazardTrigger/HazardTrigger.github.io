#version 300 es

precision highp float;

layout(location=0)in vec3 pos;
layout(location=1)in vec3 norm;
layout(location=2)in vec2 tex;
layout(location=3)in vec3 tangent;
layout(location=4)in vec3 bitangent;
layout(location=5)in uvec4 boneIds;// 每个节点受影响bone的id，一共4个
layout(location=6)in vec4 weights;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

const uint MAX_BONES=uint(100);
const uint MAX_BONE_INFLUENCE=uint(4);// 每个顶点最多受到4个bone的影响
uniform mat4 finalBonesMatrices[MAX_BONES];

out vec2 texCoords;

void main()
{
    vec4 totalPosition=vec4(0.f);
    vec3 totalNormal=vec3(0.f);

    for(uint i=uint(0);i<MAX_BONE_INFLUENCE;++i)
    {
        // if (boneIds[i] == -1)
        // {
            //     continue;
        // }

        if(boneIds[i]>=MAX_BONES)
        {
            totalPosition=vec4(pos,1.f);
            break;
        }

        vec4 localPosition=finalBonesMatrices[boneIds[i]]*vec4(pos,1.f);

        // 根据每个bone对顶点影响的加权来累加顶点的位置，每个权重加起来=1 w1 + w2 + w3 + w4 = 1
        totalPosition+=localPosition*weights[i];

        vec3 localNormal=mat3(finalBonesMatrices[boneIds[i]])*norm;

        totalNormal+=localNormal;
    }

    totalNormal=normalize(totalNormal);

    gl_Position=projection*view*model*totalPosition;

    texCoords=tex;
}
