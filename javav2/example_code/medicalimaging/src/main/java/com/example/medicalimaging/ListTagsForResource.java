// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.example.medicalimaging;

// snippet-start:[medicalimaging.java2.list_tags_for_resource.import]

// snippet-end:[medicalimaging.java2.list_tags_for_resource.import]

import software.amazon.awssdk.auth.credentials.ProfileCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.medicalimaging.MedicalImagingClient;
import software.amazon.awssdk.services.medicalimaging.model.ListTagsForResourceRequest;
import software.amazon.awssdk.services.medicalimaging.model.ListTagsForResourceResponse;
import software.amazon.awssdk.services.medicalimaging.model.MedicalImagingException;

/**
 * Before running this Java V2 code example, set up your development
 * environment, including your credentials.
 * <p>
 * For more information, see the following documentation topic:
 * <p>
 * https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/get-started.html
 */
public class ListTagsForResource {

    public static void main(String[] args) {
        final String usage = "\n" +
                "Usage:\n" +
                "    <resourceArn>\n\n" +
                "Where:\n" +
                "    resourceArn - The Amazon Resource Name (ARN) of the resource.\n";

        if (args.length != 1) {
            System.out.println(usage);
            System.exit(1);
        }

        String resourceArn = args[0];

        Region region = Region.US_WEST_2;
        MedicalImagingClient medicalImagingClient = MedicalImagingClient.builder()
                .region(region)
                .credentialsProvider(ProfileCredentialsProvider.create())
                .build();

        ListTagsForResourceResponse result = listMedicalImagingResourceTags(medicalImagingClient, resourceArn);

        if (result != null) {
            System.out.println("Tags for resource: " + result.tags());
        }

        medicalImagingClient.close();
    }

    // snippet-start:[medicalimaging.java2.list_tags_for_resource.main]
    public static ListTagsForResourceResponse listMedicalImagingResourceTags(MedicalImagingClient medicalImagingClient,
            String resourceArn) {
        try {
            ListTagsForResourceRequest listTagsForResourceRequest = ListTagsForResourceRequest.builder()
                    .resourceArn(resourceArn)
                    .build();

            return medicalImagingClient.listTagsForResource(listTagsForResourceRequest);
        } catch (MedicalImagingException e) {
            System.err.println(e.awsErrorDetails().errorMessage());
            System.exit(1);
        }

        return null;
    }
    // snippet-end:[medicalimaging.java2.list_tags_for_resource.main]
}
