import React, { useEffect } from 'react';
import './index.less';
import MapLoader from '@/modules/Tiles2DEngine/mapLoader';

const Tiles2DEngine: React.FC = () => {
    useEffect(() => {
        let loader = new MapLoader({
            id: 'viewerContainer',
            baseUrl:
                'https://mts1.google.com/vt/lyrs=y@186112443&hl=x-local&src=app',
            mapKey: 'eIgS48TpQ70m77qKYrsx',
            minZoomLevel: 3,
            maxZoomLevel: 9,
            defaultZoomLevel: 3,
            lon: 0,
            lat: 0,
            perTileSize: 256,
        });
        console.log(loader);
    }, []);

    return <div id="viewerContainer" className="viewer"></div>;
};

export default Tiles2DEngine;
