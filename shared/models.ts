export type IssueNode = {
    id: string;
    author: {
        login: string
    };
    createdAt: string;
    comments: {
        totalCount: number
    };
    lastComment: {
        edges: {
            node: {
                updatedAt: string
            }
        }[];
    };
    lastTwoComments: {
        edges: {
            node: {
                author: {
                    login: string
                },
                body: string
            }
        }[];
    };
    commentAuthors: {
        edges: {
            node: {
                author: {
                    login: string
                },
            }
        }[];
    };
    labels: {
        edges: {
            node: {
                name: string
            }
        }[];
    };
}

export type PullRequestNode = {
    id: string;
    body: string;
    comments: {
        edges: {
            node: {
                author: {
                    login: string
                },
                body: string
            }
        }[];
    };
}

export type IssueOrPullRequestLinkNode = {
    __typename: 'Issue';
    id: string;
    number: number;
    closed: boolean;
} | {
        __typename: 'PullRequest';
    };