import GLTF from './GLTF';
import { glTFBase, GLTFBuffer, GLTFImage } from './gltf2.types';

export default class MYGLTFLoader {
    originalglTFJson?: glTFBase = undefined;
    gl: WebGL2RenderingContext;
    baseUri: string = '';
    gltf: GLTF | undefined;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
    }

    getBaseUri(uri: string) {
        let basePath: string = '';
        if (uri.lastIndexOf('/') !== -1) {
            basePath = uri.substring(0, uri.lastIndexOf('/') + 1);
        }
        return basePath;
    }

    async loadGLTF(uri: string) {
        let tempbuffers: ArrayBuffer[] = [];
        let imagesBuffer: ImageBitmap[] = [];

        this.baseUri = this.getBaseUri(uri);

        try {
            this.originalglTFJson = await fetch(new Request(uri)).then(
                (res: Response) => {
                    if (res.ok) {
                        return res.json();
                    }

                    throw new Error(
                        'LoadingError: Error occured in loading glTF JSON.',
                    );
                },
            );
        } catch (error) {
            console.error(error);
        }

        console.log('original data', this.originalglTFJson);

        const loadBuffers: Promise<boolean> = new Promise<boolean>(
            async (resolve) => {
                if (this.originalglTFJson?.buffers) {
                    const bufferPromises: Promise<ArrayBuffer>[] = [];
                    for (const bufferInfo of this.originalglTFJson.buffers) {
                        try {
                            bufferPromises.push(
                                fetch(
                                    new Request(this.baseUri + bufferInfo.uri),
                                ).then((res: Response) => {
                                    if (res.ok) {
                                        return res.arrayBuffer();
                                    }
                                    throw Error(
                                        'LoadingError: Error occured in loading buffers.',
                                    );
                                }),
                            );
                        } catch (error) {
                            console.error(error);
                        }
                    }
                    for (const [bufferID, buffer] of bufferPromises.entries()) {
                        tempbuffers[bufferID] = await buffer;
                        console.log(`buffer ${bufferID} complete`);
                    }
                }
                resolve(true);
            },
        );

        const loadImages: Promise<boolean> = new Promise<boolean>(
            async (resolve) => {
                if (this.originalglTFJson?.images) {
                    const imagePromises: Promise<ImageBitmap>[] = [];
                    for (const imageInfo of this.originalglTFJson.images) {
                        try {
                            imagePromises.push(
                                fetch(new Request(this.baseUri + imageInfo.uri))
                                    .then((res: Response) => {
                                        if (res.ok) {
                                            return res.blob();
                                        }
                                        throw Error(
                                            'LoadingError: Error occured in loading images.',
                                        );
                                    })
                                    .then((imageBlob: Blob) => {
                                        return createImageBitmap(imageBlob);
                                    }),
                            );
                        } catch (error) {
                            console.error(error);
                        }
                    }
                    for (const [imageID, image] of imagePromises.entries()) {
                        imagesBuffer[imageID] = await image;
                        console.log(`image ${imageID} complete`);
                    }
                }
                resolve(true);
            },
        );

        if ((await loadBuffers) && (await loadImages)) {
            this.gltf = new GLTF(
                this.gl,
                this.originalglTFJson!,
                tempbuffers,
                imagesBuffer,
            );
            console.log(this.gltf);
        }
    }
}
