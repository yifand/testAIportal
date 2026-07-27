import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const originalPush = VueRouter.prototype.push;
// 解决ElementUI导航栏中的vue-router在3.0版本以上重复点菜单报错问题
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch((err) => err);
};

const routes = [
  {
    path: "/login",
    name: "login",
    component: () => import("../views/login.vue"),
  },
  {
    path: "/prompt",
    name: "prompt",
    component: () => import("../views/prompt.vue"),
  },
  {
    path: "/dataView",
    name: "dataView",
    component: () => import("../views/dataView/index.vue"),
  },
  {
    path: "/",
    redirect: "/monitor/record",
    name: "home",
    component: () => import("../views/home.vue"),
    children: [
      {
        path: "billboards",
        name: "billboards",
        component: () => import("../views/billboards/index.vue"),
      },
      {
        path: "task/",
        redirect: "task/target",
        component: () => import("../views/task/index.vue"),
        children: [
          {
            path: "target",
            name: "targetTask",
            component: () => import("../views/task/target/index.vue"),
          },
        ],
      },
      {
        path: "task/target/create",
        name: "targetTaskCreate",
        component: () => import("../views/task/target/create.vue"),
      },
      {
        path: "access",
        name: "access",
        component: () => import("../views/access/index.vue"),
      },
      {
        path: "algorithm",
        name: "algorithm",
        component: () => import("../views/algorithm/index.vue"),
      },
      {
        path: "algorithm/tryout/target",
        name: "algorithmTryoutTarget",
        component: () => import("../views/algorithm/tryout/target.vue"),
      },
     
      {
        path: "analysis/knowledgeQa",
        name: "analysisKnowledgeQa",
        component: () => import("../views/analysis/knowledgeQa.vue"),
      },
      {
        path: "analysis/qa",
        name: "analysisQa",
        component: () => import("../views/analysis/qa.vue"),
      },
      {
        path: "analysis/report",
        name: "analysisReport",
        component: () => import("../views/analysis/report.vue"),
      },
      {
        path: "analysis/aiAnalysis",
        name: "analysisAiAnalysis",
        component: () => import("../views/analysis/aiAnalysis.vue"),
      },
      {
        path: "analysis/flow",
        name: "analysisFlow",
        component: () => import("../views/analysis/flow.vue"),
      },
      {
        path: "analysis/heat",
        name: "analysisHeat",
        component: () => import("../views/analysis/heat.vue"),
      },
      {
        path: "patrol-report",
        name: "patrolReport",
        component: () => import("../views/patrolReport/index.vue"),
      },
      {
        path: "myself",
        name: "myself",
        component: () => import("../views/myself/index.vue"),
      },
      {
        path: "remote/data",
        name: "remoteSensingData",
        component: () => import("../views/remoteSensing/dataManagement.vue"),
      },
      {
        path: "remote/interpret-task",
        name: "remoteInterpretTask",
        component: () => import("../views/remoteSensing/interpretTask/index.vue"),
      },
      {
        path: "remote/visualization",
        name: "remoteSensingVisualization",
        component: () => import("../views/remoteSensing/visualization.vue"),
      },
      {
        path: "remote/change-compare",
        name: "remoteChangeCompare",
        component: () => import("../views/remoteSensing/changeCompare.vue"),
      },
      {
        path: "monitor/record",
        name: "dataMonitorRecord",
        component: () => import("../views/monitor/record/index.vue"),
      },
     
    ],
  },
  {
    path: "/app/index",
    name: "appIndex",
    component: () => import("../views/app/index.vue"),
  },
  {
    path: "/app/event",
    name: "appEvent",
    component: () => import("../views/app/event.vue"),
  },
];

const router = new VueRouter({
  mode: "hash",
  routes,
  // 当路由跳转后滚动条所在的位置
  scrollBehavior(to, from, savedPosition) {
    // return 期望滚动到哪个的位置
    return { x: 0, y: 0 };
  },
});

//路由前置守卫
router.beforeEach((to, from, next) => {
  if (!["/login", "/prompt"].includes(to.path)) {
    //判断进入其他页面是否携带token
    if (localStorage.getItem("Authorization")) {
      next();
    } else {
      router.replace("/login");
    }
  } else {
    next();
  }
});

export default router;
