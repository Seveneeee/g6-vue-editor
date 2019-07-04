<template>
<div class="editor">
    <div class="bottom-container">
        <div class="left-pannel">
            <div class="itempannel-container" ref="itempannel">
                <img
            draggable="false"
            src="./node.svg"
            data-type="node"
            data-shape="flow-circle"
            data-size="72*72"
            data-color="#FA8C16"
            data-label="node节点"
            class="getItem"
          />
        </div>
            </div>
            <div class="center-pannel">
                <div class="flow" ref="flow"></div>
                <div class="contextmenu" ref="contextmenu" style="position: absolute; z-index: 2;">
                    <div data-status="node-selected" class="menu" style="display: none;">
                        <div data-command="copy" class="command disable">
                            <span>复制</span>
                        </div>
                        <div data-command="delete" class="command disable">
                            <span>删除</span>
                        </div>
                    </div>
                    <div data-status="edge-selected" class="menu" style="display: none;">
                        <div data-command="delete" class="command disable">
                            <span>删除</span>
                        </div>
                    </div>
                    <div data-status="group-selected" class="menu" style="display: none;">
                        <div data-command="copy" class="command disable">
                            <span>复制</span>
                        </div>
                        <div data-command="delete" class="command disable">
                            <span>删除</span>
                        </div>
                        <div data-command="unGroup" class="command disable">
                            <span>解组</span>
                        </div>
                    </div>
                    <div data-status="canvas-selected" class="menu" style="display: block;">
                        <div data-command="undo" class="command disable">
                            <span>撤销</span>
                        </div>
                        <div data-command="redo" class="command disable">
                            <span>重做</span>
                        </div>
                        <div data-command="pasteHere" class="command disable">
                            <span>粘贴</span>
                        </div>
                    </div>
                    <div data-status="multi-selected" class="menu" style="display: none;">
                        <div data-command="copy" class="command disable">
                            <span>复制</span>
                        </div>
                        <div data-command="paste" class="command disable">
                            <span>粘贴</span>
                        </div>
                        <div data-command="delete" class="command disable">
                            <span>删除</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="right-pannel">
                <div class="detail-pannel">
                    <div ref="detailpannel">
                        <div data-status="node-selected" class="pannel" style="display: none;">
                            <div class="pannel-title">节点</div>
                            <div class="block-container">
                                <div class="p name">
                                    名称：
                                    <el-input size="mini" v-model="nodeName"></el-input>
                                </div>
                                <div class="p size">
                                    尺寸：
                                    <el-input size="mini" v-model="nodeWidth"></el-input>
                                    <el-input size="mini" v-model="nodeHeight"></el-input>
                                </div>
                                <div class="p color">
                                    颜色：
                                    <el-color-picker v-model="nodeColor" size="mini"></el-color-picker>
                                </div>
                            </div>
                        </div>
                        <div data-status="canvas-selected" class="pannel" id="canvas_detailpannel" style="display: none;">
                            <div class="pannel-title">画布</div>
                            <div class="block-container">
                                <el-checkbox v-model="gridCheck">网格对齐</el-checkbox>
                            </div>
                        </div>
                        <!-- <div
              data-status="multi-selected"
              class="pannel"
              id="multi_detailpannel"
              style="display: block;"
            >
              <div class="pannel-title">多选</div>
              <div class="block-container">
                <div class="p color">
                  颜色：
                  <el-color-picker
                    v-model="multiColor"
                    size="mini"
                  ></el-color-picker>
                </div>
              </div>
            </div> -->
                    </div>
                </div>
                <div class="navigator">
                    <span class="pannel-title">导航器</span>
                    <div class="mini-map" ref="minimap"></div>
                </div>
                <div class="zoom-slider">
                    <el-slider v-model="zoomRatio" show-input input-size="mini" :max="200" :format-tooltip="formatTooltip"></el-slider>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import G6Editor from '@antv/g6-editor';
import '../lib/icon/font.css'
import {
    setTimeout
} from 'timers';

export default {
    name: 'Editor',
    data() {
        return {
            page: null,
            flow: null,
            graph: null,
            nodeId: null,
            nodeName: null,
            nodeWidth: null,
            nodeHeight: null,
            nodeColor: null,
            multiId: [], // 多选模式选中的node节点id
            multiColor: null, // 多选模式下的color，仅以最后一个为代表颜色
            isMultiSelect: false, // 是否是多选模式
            gridCheck: false,
            zoomRatio: 100
        }
    },
    mounted() {
        this.initEditor()
    },
    watch: {
        nodeName(newValue) {
            this.flow.update(this.nodeId, {
                label: newValue
            })
        },
        nodeWidth(newValue) {
            this.flow.update(this.nodeId, {
                size: `${newValue}*${this.nodeHeight}`
            })
        },
        nodeHeight(newValue) {
            this.flow.update(this.nodeId, {
                size: `${this.nodeWidth}*${newValue}`
            })
        },
        multiColor(newValue) {
            this.multiId.forEach(id => {
                this.flow.update(id, {
                    color: newValue
                })
            })
        },
        nodeColor(newValue, oldValue) {
            if (oldValue === null) return
            this.flow.update(this.nodeId, {
                color: newValue
            })
        },
        gridCheck(newValue) {
            newValue ? this.page.showGrid() : this.page.hideGrid()
        },
        zoomRatio(newValue) {
            this.graph.zoom(newValue / 100)
        }
    },
    methods: {
        /**
         * @description: 初始化编辑器
         */
        initEditor() {
            const editor = new G6Editor()
            // 关闭追踪反馈
            G6Editor.track(false)
            // 基础流程图
            this.flow = new G6Editor.Flow({
                graph: {
                    container: this.$refs.flow
                },
                align: {
                    grid: true // 网格对齐
                },
                grid: {
                    cell: 20 // 网孔尺寸
                },
                shortcut: {
                    zoomIn: true, // 开启放大快捷键
                    zoomOut: true // 开启视口缩小快捷键
                },

            })
            // 流程图图类
            this.itempannel = new G6Editor.Itempannel({
                container: this.$refs.itempannel
            })
            // 缩略图
            this.minimap = new G6Editor.Minimap({
                container: this.$refs.minimap
            })
            // 命令工具
            // this.toolbar = new G6Editor.Toolbar({
            //   container: this.$refs.toolbar
            // })
            // 右键菜单
            this.contextmenu = new G6Editor.Contextmenu({
                container: this.$refs.contextmenu
            })
            // 详细信息面板
            this.detailpannel = new G6Editor.Detailpannel({
                container: this.$refs.detailpannel
            })

            // 通过editor添加关联
            editor.add(this.flow)
            editor.add(this.itempannel)
            editor.add(this.minimap)
            // editor.add(this.toolbar)
            editor.add(this.contextmenu)
            editor.add(this.detailpannel)

            // 判断是否是多选模式
            editor.on('aftercommandexecute', ev => {
                switch (ev.command.name) {
                    case 'multiSelect':
                        this.multiId = [] // 多选前清空上一个状态
                        this.isMultiSelect = true
                        break
                    case 'undo':
                        this.isMultiSelect = false
                        break
                    default:
                        break
                }
            })

            // 流图读取数据
            this.data && this.flow.read(this.data)

            // 获取流图的graph示例
            this.graph = this.flow.getGraph()
            // 居中画布中的内容
            this.graph.setFitView('cc')
            // 边形状映射
            this.graph.edge({
                style: {
                    stroke: '#79838e'
                },
                shape: 'polyline',
                labelRectStyle: {
                    fill: '#ffffff'
                }
            })

            // 获取当前页
            this.page = editor.getCurrentPage();
            console.log(editor)
            console.log(this.flow)
            console.log(this.page)
            // 默认关闭网格对齐
            this.page.hideGrid()
            // 修改添加边的模型
            this.page.changeAddEdgeModel({
                shape: 'polyline'
            })
            //合理的连线
            this.page.on('dragedge:beforeshowanchor', ev => {
                let sourceId = ev.source.id;
                let targetId = ev.target.id;
                //不能指向同一锚点
                if (sourceId == targetId) {
                    ev.cancel = true;
                }
                //如果source与target已有相同指向锚点相连,则不能再次相连
                const edges = this.page.save().edges; //获取图中所有的edges
                if (!!edges) {
                    edges.forEach(item => {
                        if (item.source == sourceId && item.target == targetId) ev.cancel = true;
                    })
                }
            });

            this.page.on('anchor:mousedown', ev => {
                //记下点击的锚点
                this.anchorNodeId = ev.shape.getItem().id;
            })
            this.page.on('mouseup', ev => {
                //判断鼠标松开的时候是否是连在锚点上,如果没有则去除这条无效指向的边
                if (ev._type == "mouseup" && this.anchorNodeId) {
                    //获取这个节点的所有edges
                    setTimeout(() => {
                        const node = this.page.find(this.anchorNodeId)
                        const edges = node.getEdges();
                        edges.forEach(item => {
                            if (!item.target.type) this.page.remove(item.id)
                        })
                        this.anchorNodeId = null;
                    })
                }

            })

            // 取消多选
            this.page.on('beforeitemunselected', () => {
                this.isMultiSelect = false
            })

            // 自动更新
            this.graph.on('afterchangesize', () => {
                this.graph.update()
            })
        },

        /**
         * @description: 保存流图数据
         */
        saveFlow() {
            const data = this.flow.save()
            this.getData(data)
            // this.$message({
            //   message: '数据保存成功！',
            //   type: 'success'
            // })
        },

        /**
         * @description: 下载流图
         */
        // downloadFlow() {
        //   this.page.hideGrid()
        //   this.graph.setFitView('cc')
        //   const canvas = this.$refs.flow.childNodes[0].childNodes[0]

        //   const imgData = canvas.toDataURL('image/png')
        //   const pdf = new JsPDF({
        //     orientation: 'l', // 竖排
        //     unit: 'pt',
        //     format: 'a4'
        //   })
        //   // const width = 1190.55 // a3
        //   const pdfWidth = 840.51 // a4
        //   pdf.addImage(imgData, 'PNG', 0, 0,
        // pdfWidth, pdfWidth / canvas.width * canvas.height, '', 'FAST')
        //   pdf.save('download.pdf')
        // },

        /**
         * @description: 格式化
         */
        formatTooltip(val) {
            return `${val}%`
        }
    }
}
</script>

<style lang="scss" scoped>
.editor {
    position: relative;
    width: 100%;
    height: 100%;

    .top-container {
        position: absolute;
        padding: 5px 20px;
        width: 100%;
        border: 1px solid #e9e9e9;
        height: 42px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #ffffff;
        box-shadow: 0px 8px 12px 0px rgba(0, 52, 107, 0.04);

        .toolbar {
            height: 100%;
            width: 80%;

            .command {
                width: 27px;
                height: 27px;
                margin: 0px 6px;
                border-radius: 2px;
                padding-left: 4px;
                display: inline-block;
                border: 1px solid rgba(2, 2, 2, 0);
            }

            .disable {
                color: rgba(0, 0, 0, 0.25);
            }
        }

        .data-opt {
            width: 20%;
            height: 100%;
            text-align: right;
        }
    }

    .bottom-container {
        // padding-top: 53px;
        width: 100%;
        height: 100%;
        display: flex;
        background: #f7f9fb;
        justify-content: space-around;

        .title {
            display: flex;
            width: 100%;
            align-items: center;
            height: 34px;
            font-weight: 600;
            font-size: 16px;
            padding: 0 20px;
            background: #cfd4d9;
        }

        .left-pannel {
            width: 15%;
            min-width: 300px;
            height: 100%;
            padding: 20px;
            display: inline-flex;
            flex-direction: column;
            align-items: center;

            .itempannel-container {
                width: 199px;
                height: 192px;

                img {
                    width: 92px;
                    height: 96px;
                    padding: 4px;
                    margin-left: 4px;
                    border-radius: 2px;
                    border: 1px solid rgba(0, 0, 0, 0);
                    vertical-align: middle;
                    cursor: pointer;
                }
            }
        }

        .center-pannel {
            background: #ffffff;
            display: inline-block;
            width: 70%;
            height: 100%;
            border: 1px solid #dedbe2;

            .flow {
                width: 100%;
                height: 100%;
                overflow: hidden;
            }

            .contextmenu {
                margin: 0px;
                width: 200px;
                background: white;
                box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.25);
                color: #000;
                font-size: 12px;
                display: none;

                .command {
                    height: 12px;
                    padding: 8px;
                    box-sizing: content-box;
                }

                .command:hover {
                    cursor: pointer;
                    background: #e6f7ff;
                }

                .disable {
                    color: rgba(0, 0, 0, 0.25);
                }
            }
        }

        .right-pannel {
            width: 15%;
            min-width: 300px;
            height: 100%;
            display: inline-flex;
            flex-direction: column;

            .detail-pannel {
                width: 100%;
                height: 70%;
                background: #f7f9fb;
                border-left: 1px solid #e6e9ed;
                font-size: 13px;

                .pannel-title {
                    height: 32px;
                    border-top: 1px solid #dce3e8;
                    border-bottom: 1px solid #dce3e8;
                    background: #ebeef2;
                    color: #000;
                    line-height: 28px;
                    padding-left: 12px;
                }

                .block-container {
                    padding: 16px 8px;

                    .p {
                        margin-bottom: 12px;
                    }

                    .p.name {
                        .el-input {
                            width: 60%;
                            padding: 0 10px;
                        }
                    }

                    .p.size {
                        .el-input {
                            width: 30%;
                            padding: 0 10px;
                        }
                    }

                    .p.color {
                        .el-color-picker {
                            vertical-align: middle;
                        }
                    }
                }
            }

            .navigator {
                width: 100%;
                height: 25%;
                flex-grow: 1;

                .pannel-title {
                    display: block;
                    height: 32px;
                    border-top: 1px solid #dce3e8;
                    border-bottom: 1px solid #dce3e8;
                    background: #ebeef2;
                    color: #000;
                    line-height: 28px;
                    padding-left: 12px;
                }

                .mini-map {
                    width: 100%;
                    height: calc(100% - 34px);
                }
            }

            .zoom-slider {
                width: 100%;
                height: 5%;
                padding: 5px 10px;
                background: #ffffff;
            }
        }
    }
}
</style>
