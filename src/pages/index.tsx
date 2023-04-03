import React from 'react';
import 'antd/dist/antd.css'; // or 'antd/dist/antd.less'
import GLTF2Engine from './GLTFEngine/indes';
import SmartCity from './SmartCity';

const Index: React.FC = () => {
    return (
        <div>
            {/* <GLTF2Engine /> */}
            <SmartCity />
        </div>
    );
};

export default Index;
