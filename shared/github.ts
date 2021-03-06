import { performHttpRequest } from './http';
import { IssueNode, PullRequestNode, IssueOrPullRequestLinkNode, Milestone, PullRequest, IssueWithLabels } from './models';

// private functions

const performGitHubGraphqlRequest = (headers: any, data: any, success?: (response: any) => any) => {
  performHttpRequest('api.github.com', '/graphql', 'POST', headers, data, success);
}

const performGitHubRestRequest = (headers: any, route: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE', data?: any, success?: (response: any) => any) => {
  performHttpRequest('api.github.com', route, method, headers, data, success);
}

// queries

export const getAllGitHubIssuesRecursively = (headers: any, repoOwner: string, repoName: string, afterCursor: string, callback: (issues: IssueNode[]) => any) => {
  performGitHubGraphqlRequest(headers, {
    query: getGitHubIssuesQuery(repoOwner, repoName, afterCursor)
  }, (response) => {
    if (response.data.repository.issues.pageInfo.hasNextPage) {
      getAllGitHubIssuesRecursively(headers, repoOwner, repoName, response.data.repository.issues.pageInfo.endCursor, (issues) => {
        callback(issues.concat(response.data.repository.issues.edges.map(edge => edge.node)));
      });
    } else {
      callback(response.data.repository.issues.edges.map(edge => edge.node));
    }
  });
}
export const getAllGitHubIssuesRecursivelyFilterWithLabels = (headers: any, repoOwner: string, repoName: string, afterCursor: string, labels: string[], callback: (issues: IssueNode[]) => any) => {
  performGitHubGraphqlRequest(headers, {
    query: getGitHubIssuesQuery(repoOwner, repoName, afterCursor, labels)
  }, (response) => {
    if (response.data.repository.issues.pageInfo.hasNextPage) {
      getAllGitHubIssuesRecursivelyFilterWithLabels(headers, repoOwner, repoName, response.data.repository.issues.pageInfo.endCursor, labels, (issues) => {
        callback(issues.concat(response.data.repository.issues.edges.map(edge => edge.node)));
      });
    } else {
      callback(response.data.repository.issues.edges.map(edge => edge.node));
    }
  });
}
const getGitHubIssuesQuery = (repoOwner: string, repoName: string, afterCursor?: string, labels?: string[]): string => {
  const variables = [
    {
      name: 'first',
      value: 50
    },
    {
      name: 'after',
      value: afterCursor ? `"${afterCursor}"` : null
    },
    {
      name: 'labels',
      value: labels ? JSON.stringify(labels) : null
    }
  ];

  return `
      query { 
        repository(owner: "${repoOwner}", name: "${repoName}") { 
          issues(states: [OPEN], ${variables.filter(v => !!v).map(v => `${v.name}: ${v.value}`).join(', ')}) {
            pageInfo {
              hasNextPage,
              endCursor
            },
            edges {
              node {
                id,
                number,
                author {
                  login
                },
                createdAt,
                comments {
                    totalCount
                },
                lastComment: comments(last: 1) {
                    edges {
                      node {
                        updatedAt
                      }
                  }
                },
                lastTwoComments: comments(last: 2) {
                  edges {
                    node {
                      author {
                        login
                      },
                      body
                    }
                  }
                },
                commentAuthors: comments(first: 100) {
                  edges {
                    node {
                      author {
                        login
                      }
                    }
                  }
                },
                labels(first: 10) {
                  edges {
                    node {
                      name
                    }
                  }
                },
                milestone {
                  number,
                  state
                }
              }
            }
          }
        }
      }`;
}

export const getPullRequest = (headers: any, repoOwner: string, repoName: string, number: number, callback: (pr: PullRequestNode) => any) => {
  performGitHubGraphqlRequest(headers, {
    query: getPullRequestQuery(repoOwner, repoName, number)
  }, (response) => {
    callback(response.data.repository.pullRequest);
  });
}
const getPullRequestQuery = (repoOwner: string, repoName: string, number: number): string => {
  return `
      query { 
        repository(owner: "${repoOwner}", name: "${repoName}") { 
          pullRequest(number: ${number}) {
            id,
            body,
            comments(first: 100) {
              edges {
                node {
                  author {
                    login
                  },
                  body
                }
              }
            }
          }
        }
      }`;
}

export const getIssueOrPullRequestLinks = (headers: any, repoOwner: string, repoName: string, numbers: number[], callback: (nodes: IssueOrPullRequestLinkNode[]) => any) => {
  performGitHubGraphqlRequest(headers, {
    query: getIssueOrPullRequestLinksQuery(repoOwner, repoName, numbers)
  }, (response) => {
    const results = numbers.map((_, index) => response.data.repository['result' + index]);
    callback(results);
  });
}
const getIssueOrPullRequestLinksQuery = (repoOwner: string, repoName: string, numbers: number[]) => {
  const resultList = numbers
    .map((n, index) => {
      return `
              result${index}: issueOrPullRequest(number: ${n}) {
                __typename
                ... on Issue {
                  id,
                  number,
                  closed
                }
              }`;
    })
    .join(',');

  return `
      query {
        repository(owner: "${repoOwner}", name: "${repoName}") {
          ${resultList}
        }
      }`;
}

export const getAllMilestones = (headers: any, repoOwner: string, repoName: string, callback: (milestones: Milestone[]) => any) => {
  performGitHubGraphqlRequest(headers, {
    query: getAllMilestonesQuery(repoOwner, repoName)
  }, (response) => {
    callback(response.data.repository.milestones.edges.map(edge => edge.node));
  });
}
const getAllMilestonesQuery = (repoOwner: string, repoName: string) => {
  return `
    query {
      repository(owner: "${repoOwner}", name: "${repoName}") {
        milestones(first: 100) {
          edges {
            node {
              id,
              state,
              dueOn,
              number
            }
          }
        }
      }
    }`;
}

export const getAllOpenPullRequests = (headers: any, repoOwner: string, repoName: string, callback: (pullRequests: PullRequest[]) => any) => {
  performGitHubGraphqlRequest(headers, {
    query: getAllOpenPullRequestsQuery(repoOwner, repoName)
  }, (response) => {
    callback(response.data.repository.pullRequests.edges.map(edge => edge.node));
  });
}
const getAllOpenPullRequestsQuery = (repoOwner: string, repoName: string) => {
  return `
      query { 
        repository(owner: "${repoOwner}", name: "${repoName}") { 
          pullRequests(states: [OPEN], first: 100) {
            edges {
              node {
                id,
                number,
                author {
                  login
                },
                createdAt,
                comments {
                  totalCount
                },
                lastComment: comments(last: 1) {
                  edges {
                    node {
                      updatedAt
                    }
                  }
                },
                lastTwoComments: comments(last: 2) {
                  edges {
                    node {
                      author {
                        login
                      },
                      body
                    }
                  }
                },
                reviews(last: 10) {
                  edges {
                    node {
                      updatedAt
                    }
                  }
                },
                labels(first: 10) {
                  edges {
                    node {
                      name
                    }
                  }
                },
                milestone {
                  number
                },
                assignees(first: 10) {
                  edges {
                    node {
                      id,
                      login
                    }
                  }
                }
              }
            }
          }
        }
      }`;
}

export const getIssuesLabels = (headers: any, repoOwner: string, repoName: string, numbers: number[], callback: (issuesWithLabels: IssueWithLabels[]) => any) => {
  performGitHubGraphqlRequest(headers, {
    query: getIssuesLabelsQuery(repoOwner, repoName, numbers)
  }, (response) => {
    const results = numbers
      .map((n, index) => ({
        number: n,
        labels: response.data.repository['result' + index].labels.edges.map(edge => edge.node.name)
      }));
    callback(results);
  });
}
const getIssuesLabelsQuery = (repoOwner: string, repoName: string, numbers: number[]) => {
  const resultList = numbers
    .map((n, index) => {
      return `
            result${index}: issue(number: ${n}) {
              labels(first: 100) {
                edges {
                  node {
                    name
                  }
                }
              }
            }`;
    })
    .join(',');

  return `
    query {
      repository(owner: "${repoOwner}", name: "${repoName}") {
        ${resultList}
      }
    }`;
}

// mutations

export const commentGitHubIssue = (headers: any, issueId: string, comment: string) => {
  performGitHubGraphqlRequest(headers, {
    query: addGitHubCommentMutation(issueId, comment)
  });
}
export const commentGitHubPullRequest = (headers: any, pullRequestId: string, comment: string) => {
  performGitHubGraphqlRequest(headers, {
    query: addGitHubCommentMutation(pullRequestId, comment)
  });
}
const addGitHubCommentMutation = (subjectId: string, comment: string): string => {
  return `
      mutation {
        addComment(input: { subjectId: "${subjectId}", body: "${comment}" }) {
          subject {
            id
          }
        }
      }`;
}

// these mutations are not currently available - using the REST API instead
export const closeGitHubIssue = (headers: any, owner: string, repo: string, issueNumber: number, issueId: string) => {
  const useGraphql = false;

  if (useGraphql) {
    performGitHubGraphqlRequest(headers, {
      query: closeGitHubIssueMutation(issueId)
    });
  } else {
    performGitHubRestRequest(headers, `/repos/${owner}/${repo}/issues/${issueNumber}`, 'PATCH', {
      state: 'closed'
    });
  }
}
const closeGitHubIssueMutation = (issueId: string): string => {
  return `
      mutation {
        closeIssue(input: { subjectId: "${issueId}" }) {
          subject {
            id
          }
        }
      }`;
}

export const setLabelsForIssue = (headers: any, owner: string, repo: string, issueNumber: number, labels: string[]) => {
  performGitHubRestRequest(headers, `/repos/${owner}/${repo}/issues/${issueNumber}`, 'PATCH', {
    labels
  });
}