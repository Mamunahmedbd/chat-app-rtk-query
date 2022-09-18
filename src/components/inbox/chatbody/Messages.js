import InfiniteScroll from "react-infinite-scroll-component";
import { useSelector } from "react-redux";
import Message from "./Message";

export default function Messages({ messages = [], fetchMore, hasMore }) {
  const { user } = useSelector((state) => state.auth) || {};
  const { email } = user || {};

  return (
    <div
      id="scrollableDiv"
      className="relative w-full h-[calc(100vh_-_197px)] p-6 overflow-y-auto flex flex-col-reverse"
    >
      <InfiniteScroll
        dataLength={messages?.length}
        next={fetchMore}
        hasMore={hasMore}
        inverse={true}
        loader={<h4>Loading...</h4>}
        style={{ display: "flex", flexDirection: "column-reverse" }}
        scrollableTarget="scrollableDiv"
      >
        <ul className="space-y-2">
          {messages
            .slice()
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((message) => {
              const { message: lastMessage, id, sender } = message || {};

              const justify = sender.email !== email ? "start" : "end";

              return (
                <Message key={id} justify={justify} message={lastMessage} />
              );
            })}
        </ul>
      </InfiniteScroll>
    </div>
  );
}
