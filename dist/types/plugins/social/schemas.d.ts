export declare const PostSchema: {
    $schema: string;
    title: string;
    type: string;
    required: string[];
    properties: {
        id: {
            type: string;
            description: string;
        };
        author: {
            oneOf: ({
                type: string;
                description: string;
            } | {
                type: string[];
                description: string;
            })[];
        };
        content: {
            type: string;
            description: string;
            default: string;
        };
        timestamp: {
            type: string;
            description: string;
        };
        attachment: {
            type: string[];
            description: string;
        };
        payload: {
            type: string[];
            description: string;
            properties: {
                content: {
                    type: string;
                    description: string;
                    default: string;
                };
                attachment: {
                    type: string[];
                    description: string;
                };
            };
            additionalProperties: boolean;
        };
        title: {
            type: string[];
            description: string;
        };
        topic: {
            type: string[];
            description: string;
        };
        reference: {
            type: string[];
            description: string;
        };
        likes: {
            type: string[];
            description: string;
            patternProperties: {
                "^[a-zA-Z0-9-_]+$": {
                    type: string;
                };
            };
            additionalProperties: boolean;
        };
        comments: {
            type: string[];
            description: string;
            patternProperties: {
                "^[a-zA-Z0-9-_]+$": {
                    type: string;
                };
            };
            additionalProperties: boolean;
        };
    };
    additionalProperties: boolean;
};
export declare const CommentSchema: {
    $schema: string;
    title: string;
    type: string;
    required: string[];
    properties: {
        id: {
            type: string;
            description: string;
        };
        postId: {
            type: string;
            description: string;
        };
        author: {
            type: string;
            description: string;
        };
        content: {
            type: string;
            description: string;
        };
        timestamp: {
            type: string;
            description: string;
        };
    };
    additionalProperties: boolean;
};
export declare const UserProfileSchema: {
    $schema: string;
    title: string;
    type: string;
    required: string[];
    properties: {
        pub: {
            type: string;
            description: string;
        };
        alias: {
            type: string;
            description: string;
            nullable: boolean;
        };
        bio: {
            type: string;
            description: string;
            nullable: boolean;
        };
        profileImage: {
            type: string;
            description: string;
            nullable: boolean;
        };
        followers: {
            type: string;
            description: string;
            items: {
                type: string;
            };
        };
        following: {
            type: string;
            description: string;
            items: {
                type: string;
            };
        };
        customFields: {
            type: string;
            description: string;
            additionalProperties: {
                type: string[];
            };
        };
    };
    additionalProperties: boolean;
};
