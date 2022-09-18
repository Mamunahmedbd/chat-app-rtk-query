import { io } from "socket.io-client";
import { apiSlice } from "../api/apiSlice";

export const messagesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMessages: builder.query({
      query: (id) =>
        `/messages?conversationId=${id}&_sort=timestamp&_order=desc&_page=1&_limit=${process.env.REACT_APP_MESSAGES_PER_PAGE}`,
      transformResponse(apiResponse, meta) {
        const totalCount = meta.response.headers.get("X-Total-Count");
        return {
          data: apiResponse,
          totalCount,
        };
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        // create socket
        const socket = io("https://mamun-chat-server.herokuapp.com", {
          reconnectionDelay: 1000,
          reconnection: true,
          reconnectionAttemps: 10,
          transports: ["websocket"],
          agent: false,
          upgrade: false,
          rejectUnauthorized: false,
        });

        try {
          await cacheDataLoaded;
          socket.on("message", (data) => {
            updateCachedData((draft) => {
              //      const { id, users, message, timestamp } = data?.data;
              //
              //     Need to check duplicate message,
              //     because socket event fire before
              //     pessimistic cache update event
              //
              //     const foundMsg = draft.data.findIndex(
              //       (msg) => msg.timestamp === timestamp
              //     );
              //     if (foundMsg === -1) {
              //       draft.data.push({
              //         conversationId: id,
              //         sender: users[0],
              //         receiver: users[1],
              //         message: message,
              //         timestamp: timestamp,
              //       });
              //     }
              //   });
              // });

              const foundMsg = draft.data.findIndex(
                (msg) => msg.timestamp === data?.data?.timestamp
              );
              if (foundMsg === -1) draft.data.push(data?.data);
            });
          });
        } catch (err) {}

        await cacheEntryRemoved;
        socket.close();
      },
    }),
    getMoreMessages: builder.query({
      query: ({ id, page }) =>
        `/messages?conversationId=${id}&_sort=timestamp&_order=desc&_page=${page}&_limit=${process.env.REACT_APP_MESSAGES_PER_PAGE}`,
      async onQueryStarted({ id }, { queryFulfilled, dispatch }) {
        try {
          const messages = await queryFulfilled;
          if (messages?.data?.length > 0) {
            // update conversation cache pessimistically start
            dispatch(
              apiSlice.util.updateQueryData(
                "getMessages",
                id.toString(),
                (draft) => {
                  return {
                    data: [...draft.data, ...messages.data],
                    totalCount: Number(draft.totalCount),
                  };
                }
              )
            );
            // update messages cache pessimistically end
          }
        } catch (err) {}
      },
    }),
    addMessage: builder.mutation({
      query: (data) => ({
        url: "/messages",
        method: "POST",
        body: data,
      }),

      // May be useless, because we update message in addConversation, editConversation

      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const message = await queryFulfilled;
          if (message?.data?.id) {
            dispatch(
              apiSlice.util.updateQueryData(
                "getMessages",
                message?.data?.id.toString(),
                (draft) => {
                  draft.data.push(message?.data);
                }
              )
            );
          }
        } catch (err) {
          console.log(err);
        }
      },
    }),
  }),
});

export const { useGetMessagesQuery, useAddMessageMutation } = messagesApi;
