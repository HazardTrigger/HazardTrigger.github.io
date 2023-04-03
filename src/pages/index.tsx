import React, { createElement } from 'react';
import 'antd/dist/antd.css'; // or 'antd/dist/antd.less'
import { Avatar, List, Space } from 'antd';
import './index.less';
import { LinkOutlined } from '@ant-design/icons';
import { Link } from 'umi';

import avatar from '../assets/images/avatar.jpg';
import gltfExtras from '../assets/images/gltfEngine.png';
import smartCityExtras from '../assets/images/smartCity.png';
import tiles2dExtras from '../assets/images/tiles2dExtras.png';

const data = [
    {
        path: '/gltfEngine',
        title: `GLTF2.0 解析引擎`,
        avatar: avatar,
        description:
            '技术栈：WebGL2.0, shader, gl-matrix, react, ant design, threejs',
        content:
            '参考gltf2.0 specification文档实现的gltf2.0解析引擎，使用原生WebGL2 api实现，实现了骨骼动画解析',
        extras: gltfExtras,
    },
    {
        path: '/tiles2dEngine',
        title: `2D瓦片解析引擎`,
        avatar: avatar,
        description: '技术栈：canvas, react, threejs',
        content:
            '瓦片地图的原理实现, 大型场景加载渲染算法初步实现，瓦片原理参考：https://www.maptiler.com/google-maps-coordinates-tile-bounds-projection/#3/15.00/50.00',
        extras: tiles2dExtras,
    },
    {
        path: '/smartCity',
        title: `智慧城市Demo`,
        avatar: avatar,
        description: '技术栈：shader, react, threejs',
        content: '加载场景模型，使用shader实现一些有趣的特效',
        extras: smartCityExtras,
    },
];

const IconText = ({
    icon,
    text,
    path,
}: {
    icon: React.FC;
    text: string;
    path: string;
}) => (
    <Link to={path}>
        <Space>
            {createElement(icon)}
            {text}
        </Space>
    </Link>
);

const App: React.FC = () => (
    <List
        itemLayout="vertical"
        size="large"
        // pagination={{
        //     onChange: (page) => {
        //         console.log(page);
        //     },
        //     pageSize: 3,
        // }}
        dataSource={data}
        // footer={
        //     <div>
        //         <b>ant design</b> footer part
        //     </div>
        // }
        renderItem={(item) => (
            <List.Item
                key={item.title}
                actions={[
                    <IconText
                        path={item.path}
                        icon={LinkOutlined}
                        text="链接"
                        key="list-vertical-link-o"
                    />,
                    // <IconText
                    //     icon={LikeOutlined}
                    //     text="156"
                    //     key="list-vertical-like-o"
                    // />,
                ]}
                extra={<img width={272} alt="logo" src={item.extras} />}
            >
                <List.Item.Meta
                    avatar={<Avatar src={item.avatar} />}
                    title={item.title}
                    description={item.description}
                />
                {item.content}
            </List.Item>
        )}
    />
);

export default App;
