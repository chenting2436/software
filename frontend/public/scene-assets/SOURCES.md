# 演示素材与边界

## 设备模型
四个 GLB 模型及交互模型为项目内程序化创建，外部轮廓参考用户提供的四张设备截图。无真实尺寸、内部图纸、厂商性能认证；内部零件仅为概念示意，不用于制造。

## 地形
白云鄂博周边，109.94–110.06°E / 41.755–41.845°N。地理区域参考 NASA PIA13969 公布的约 41.8°N、110°E。
高程来源：https://registry.opendata.aws/terrain-tiles/
Mapzen / Tilezen Terrain Tiles on AWS。SRTM/GMTED2010 terrain data courtesy of the U.S. Geological Survey。
数据归属与使用说明：https://github.com/tilezen/joerd/blob/master/docs/attribution.md
2026-09-21 访问。129×129 重采样网格，不是当前矿区实测或厘米级模型。主视图的台阶式矿坑另为本地概念场景，与公开地形明确分开。

## 历史影像
白云鄂博：2006-06-30 ASTER，NASA/GSFC/METI/ERSDAC/JAROS and U.S./Japan ASTER Science Team。
https://science.nasa.gov/photojournal/baiyun-ebo-china/
宾厄姆峡谷影像对比：2011-07-20 NAIP / 2013-05-02 NASA EO-1 ALI；NASA Earth Observatory images by Jesse Allen and Robert Simmon。
https://science.nasa.gov/earth/earth-observatory/sizing-up-the-landslide-at-bingham-canyon-mine-81364/
NASA 媒体使用指南：https://www.nasa.gov/nasa-brand-center/images-and-media/
影像保留署名、原始日期、独立案例名称。不暗示 NASA 背书，不声称为矿大设备拍摄，不混充同一矿区、同传感器定量变化检测结果。

## 监控画面
巡检画面由本地三维场景合成，随演示时间和选中设备变化，标注“合成视景 / 非实拍”。不是摄像头实时流。没有使用来源不明的商业视频。

## 在线参照地图
只有用户开启在线底图时请求 OpenStreetMap 当前视野瓦片，不预下载、不离线打包；显示 © OpenStreetMap contributors 署名。服务不保证可用，失败时保留离线高程。生产商用部署应配置有服务保障的合规地图服务。
https://operations.osmfoundation.org/policies/tiles/
