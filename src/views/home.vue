<template>
    <div id="page">
        <div id="header">
            <div class="header-left">
                <div class="logo-img"><img src="@/assets/images/logo.png" alt=""></div>
                <div class="system-name">智能公路巡检平台智能体</div>
            </div>
            <div class="header-center">
                <div class="menu-scroll-wrap">
                    <button class="menu-scroll-btn left" v-if="canScrollLeft" @click="scrollMenu('left')">
                        <i class="el-icon-arrow-left"></i>
                    </button>
                    <div class="menu-scroll-container" ref="menuScrollContainer" @scroll="updateMenuScrollState">
                        <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal"
                            @select="handleSelect">

                            <el-menu-item index="2">
                                <template slot="title">
                                    <i class="el-icon-tickets"></i>
                                    <span>数据检测记录</span>
                                </template>
                            </el-menu-item>
                            <el-submenu index="3">
                                <template slot="title">
                                    <i class="el-icon-c-scale-to-original"></i>
                                    <span>公路巡检智能可视化</span>
                                </template>
                                <el-menu-item index="3-1">AI智能分析</el-menu-item>
                                <el-menu-item index="3-2">智能巡检分析报告</el-menu-item>
                            </el-submenu>
                            <el-submenu index="4">
                                <template slot="title">
                                    <i class="el-icon-edit-outline"></i>
                                    <span>智能问答</span>
                                </template>
                                <el-menu-item index="4-1">知识问答</el-menu-item>
                                <el-menu-item index="4-2">工具链调用</el-menu-item>
                                <!-- <el-menu-item index="4-3">分析报告</el-menu-item> -->
                            </el-submenu>


                        </el-menu>
                    </div>
                    <button class="menu-scroll-btn right" v-if="canScrollRight" @click="scrollMenu('right')">
                        <i class="el-icon-arrow-right"></i>
                    </button>
                </div>
            </div>
            <div class="header-right">
                <div class="user-center" @click="gotoUserInfo">
                    <i class="el-icon-user"></i>
                    <span>个人中心</span>
                </div>
                <div class="logout" @click="logout">
                    <i class="el-icon-switch-button"></i>
                    <span>退出</span>
                </div>
            </div>
        </div>
        <div id="main">
            <div class="router-view-wrapper">
                <router-view></router-view>
            </div>
            <!-- <div class="copyright">{{ copyright }}</div> -->
        </div>
    </div>
</template>

<script>
import { logout } from "@/api/login";
import baseURL from "@/utils/request";
export default {
    components: {},
    data() {
        return {
            activeIndex: "1",
            username: "",
            copyright: "",
            canScrollLeft: false,
            canScrollRight: false
        }
    },
    watch: {
        '$route.path': function (newPath) {
            this.keepActive();
        },
    },
    created() {
        this.username = localStorage.getItem("username");
        this.keepActive();
        window.addEventListener("popstate", this.keepActive, false);

        // var date = new Date();
        // var year = date.getFullYear();
        // this.copyright = "@2014-" + year + "";
    },
    mounted() {
        if (this.isMobileDevice()) {
            if (window.location.pathname.indexOf("app") == -1) {
                this.$router.replace("/app/index");
            }
        } else {
            if (window.location.pathname.indexOf("app") > -1) {
                this.$router.replace("/monitor/record");
            }
        }
        this.$nextTick(() => {
            this.updateMenuScrollState();
        });
        window.addEventListener("resize", this.updateMenuScrollState);
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.updateMenuScrollState);
    },
    methods: {
        logout() {
            logout().then(res => {
                if (res.code == 200) {
                    this.$message({
                        message: '退出登录',
                        type: 'success'
                    });
                }
                localStorage.removeItem("Authorization");
                localStorage.removeItem("permissions");
                window.close();
                if (!window.closed) {
                    this.$message.warning("浏览器阻止了自动关闭，请手动关闭标签页");
                }
            }).catch(() => {
                localStorage.removeItem("Authorization");
                localStorage.removeItem("permissions");
                window.close();
                if (!window.closed) {
                    this.$message.warning("浏览器阻止了自动关闭，请手动关闭标签页");
                }
            })

        },
        keepActive() {
            let path = this.$route.path;
            if (path.indexOf("/billboards") > -1) {
                this.activeIndex = "1";
            } else if (path.indexOf("/monitor/record") > -1) {
                this.activeIndex = "2";
            } else if (path.indexOf("/service/console/task-monitor") > -1) {
                this.activeIndex = "2-1";
            } else if (path.indexOf("/service/console/resource-dispatch") > -1) {
                this.activeIndex = "2-2";
            } else if (path.indexOf("/service/console/service-monitor") > -1) {
                this.activeIndex = "2-3";
            } else if (path.indexOf("/analysis/aiAnalysis") > -1) {
                this.activeIndex = "3-1";
            } else if (path.indexOf("/patrol-report") > -1) {
                this.activeIndex = "3-2";
            } else if (path.indexOf("/analysis/knowledgeQa") > -1) {
                this.activeIndex = "4-1";
            } else if (path.indexOf("/analysis/qa") > -1) {
                this.activeIndex = "4-2";
            } else {
                this.activeIndex = "";
            }
            this.$nextTick(() => {
                this.updateMenuScrollState();
            });
        },
        scrollMenu(direction) {
            const menuEl = this.$refs.menuScrollContainer;
            if (!menuEl) return;
            const offset = 220;
            const target = direction === "left" ? menuEl.scrollLeft - offset : menuEl.scrollLeft + offset;
            menuEl.scrollTo({
                left: target,
                behavior: "smooth"
            });
            setTimeout(() => {
                this.updateMenuScrollState();
            }, 220);
        },
        updateMenuScrollState() {
            const menuEl = this.$refs.menuScrollContainer;
            if (!menuEl) return;
            const maxScrollLeft = menuEl.scrollWidth - menuEl.clientWidth;
            this.canScrollLeft = menuEl.scrollLeft > 2;
            this.canScrollRight = maxScrollLeft - menuEl.scrollLeft > 2;
        },
        handleSelect(key, keyPath) {
            // console.log(key, keyPath);
            if (key == "1") {
                this.$router.push("/billboards");
            } else if (key == "2") {
                this.$router.push("/monitor/record");
            } else if (key == "2-1") {
                this.$router.push("/service/console/task-monitor");
            } else if (key == "2-2") {
                this.$router.push("/service/console/resource-dispatch");
            } else if (key == "2-3") {
                this.$router.push("/service/console/service-monitor");
            } else if (key == "3-1") {
                this.$router.push("/analysis/aiAnalysis");
            } else if (key == "3-2") {
                this.$router.push("/patrol-report");
            }
            else if (key == "4-1") {
                this.$router.push("/analysis/knowledgeQa");
            } else if (key == "4-2") {
                this.$router.push("/analysis/qa");
            }
        },
        gotoUserInfo() {
            this.$router.push("/myself");
        },
        isMobileDevice() {
            //判断当前设备是移动设备还是PC设备
            if (/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i.test(
                navigator.userAgent
            )) {
                return true;
            } else {
                return false;
            }
        }
    }
}
</script>
<style lang="scss" scoped>
#header {
    height: 70px;
    background: #252b3b;
    padding: 0 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
    // box-shadow: 0 0.05rem 0.01rem rgba(75, 75, 90, 0.075);
    position: fixed;
    width: 100%;
    z-index: 1999;
    color: #fff;

    .header-left {
        display: flex;
        align-items: center;
        // align-items: center;

        .logo-img {
            height: 30px;

            img {
                height: 100%;
            }
        }

        .system-name {
            font-size: 20px;
            // font-weight: 600;
            line-height: 31px;
        }
    }

    .header-center {
        flex: 1;
        margin: 0 24px;
        overflow: hidden;

        .menu-scroll-wrap {
            display: flex;
            align-items: center;
            width: 100%;
            min-width: 0;
        }

        .menu-scroll-btn {
            width: 24px;
            height: 24px;
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.08);
            color: #fff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            padding: 0;
            flex: 0 0 auto;

            &:hover {
                background: rgba(102, 177, 255, 0.2);
                border-color: rgba(102, 177, 255, 0.8);
                color: #66b1ff;
            }

            &.left {
                margin-right: 8px;
            }

            &.right {
                margin-left: 8px;
            }
        }

        .menu-scroll-container {
            flex: 1;
            min-width: 0;
            overflow-x: auto;
            overflow-y: hidden;
            scrollbar-width: none;
            -ms-overflow-style: none;

            &::-webkit-scrollbar {
                display: none;
            }
        }

        .el-menu {
            background: transparent;
            border-bottom: none;
            display: flex;
            justify-content: flex-start;
            min-width: max-content;

            &.el-menu--horizontal {
                border: none;
            }

            .el-menu-item {
                height: 70px;
                line-height: 70px;
                color: #fff;
                padding: 0 8px;
                background: transparent !important;

                &:not(:last-child) {
                    margin-right: 24px;
                }

                &.is-active {
                    color: #66b1ff !important;
                    border-color: #66b1ff;
                    font-weight: 600;
                }

                &:hover {
                    color: #66b1ff;
                    background: transparent;
                }

                &:hover i,
                &:hover span {
                    color: #66b1ff;
                }
            }

            .el-submenu {
                margin-right: 24px;

                &.is-active {
                    ::v-deep .el-submenu__title {
                        color: #66b1ff !important;
                        border-color: #66b1ff;
                        font-weight: 600;

                        i {
                            color: #66b1ff !important;
                            font-weight: 600;
                        }
                    }
                }

                ::v-deep .el-submenu__title {
                    height: 70px;
                    line-height: 70px;
                    padding: 0 8px;
                    color: #fff;
                    background: transparent !important;
                    border-bottom-color: transparent;

                    &:hover {
                        background: transparent;

                        i,
                        span {
                            color: #66b1ff;
                        }
                    }
                }
            }
        }
    }

    .header-right {
        display: flex;
        align-items: center;

        div {
            display: flex;
            align-items: center;
            cursor: pointer;

            &:not(:last-child) {
                margin-right: 20px;
            }

            &:hover {
                color: #5664d2;
            }

            i {
                font-size: 20px;
                margin-right: 5px;
            }

            span {
                font-size: 14px;
            }
        }
    }
}

::v-deep .header-center .el-menu--horizontal>.el-menu-item.is-active,
::v-deep .header-center .el-menu--horizontal>.el-submenu.is-active .el-submenu__title {
    background: transparent !important;
}

.el-menu--horizontal .el-menu .el-menu-item {
    padding-left: 20px !important;
}

.el-menu--horizontal .el-menu .el-menu-item.is-active,
.el-menu--horizontal .el-menu .el-submenu.is-active>.el-submenu__title {
    color: #5664d2;
}


#main {
    margin-top: 70px;
    flex: 1;
    min-height: 0;
    overflow: hidden;

    .router-view-wrapper {
        height: 100%;
    }
}

.copyright {
    text-align: center;
    color: #6c757d;
    font-size: 15px;
    padding: 20px 15px;
}
</style>
