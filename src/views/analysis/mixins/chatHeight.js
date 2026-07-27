export default {
  data() {
    return {
      contentHeight: null,
      messagesHeight: null
    };
  },
  mounted() {
    this.calcHeight();
    window.addEventListener('resize', this.calcHeight);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.calcHeight);
  },
  methods: {
    calcHeight() {
      this.$nextTick(() => {
        const pageHeader = this.$refs.pageHeader;
        const pageContent = window.innerHeight;
        const contentWrapper = this.$refs.contentWrapper;
        const rightPanel = this.$refs.rightPanel;
        const chatHeader = this.$refs.chatHeader;
        const chatInput = this.$refs.chatInput;
        const chatMessages = this.$refs.chatMessages;

        if (!contentWrapper || !pageHeader) return;

        // const parentRect = pageContent.parentElement.getBoundingClientRect();
        const pageHeaderRect = pageHeader.getBoundingClientRect();
        const contentHeight = pageContent - pageHeaderRect.height;
        console.log(pageContent);
        
        this.contentHeight = contentHeight;
        contentWrapper.style.height = `${contentHeight}px`;

        if (rightPanel && chatHeader && chatInput && chatMessages) {
          const rightPanelRect = rightPanel.getBoundingClientRect();
          const headerRect = chatHeader.getBoundingClientRect();
          const inputRect = chatInput.getBoundingClientRect();
          const messagesHeight = contentHeight - headerRect.height - inputRect.height -150;
          this.messagesHeight = Math.max(messagesHeight, 0);
          chatMessages.style.height = `${this.messagesHeight}px`;
          console.log(this.messagesHeight,pageContent,rightPanelRect.height,'333');
          
        }
      });
    }
  }
};
